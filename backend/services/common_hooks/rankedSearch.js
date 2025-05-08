import tsquery from "pg-tsquery";

const parser = tsquery();

function applyBasicPrefixing(input) {
  return input
    .split(/\s+/)
    .map((token) => {
      if (
        token.match(/["'()|&!:]/) ||  // already quoted or operator
        token.endsWith(':*') ||      // already prefixed
        token.length === 0
      ) {
        return token;
      }
      return `${token}:*`;
    })
    .join(' ');
}


export const rankedSearch = async (context) => {
  const { query = {} } = context.params;
  const { fields, searchTerm, language = 'english' } = query.fullText || {};
  if (!searchTerm || !fields) return context;

  delete query.fullText;

  const knex = context.app.get('postgresqlClient');

  // Always apply prefix matching by default on all terms
  const tsqueryString = parser(applyBasicPrefixing(searchTerm));

  const tsvectorExpr = fields.map((f) => `coalesce(${f}::text, '')`).join(` || ' ' || `);

  const baseQuery = context.service
    .createQuery({ ...context.params, query });

  const fullTextQuery = baseQuery
    .clone()
    .whereRaw(`to_tsvector(?, ${tsvectorExpr}) @@ to_tsquery(?, ?)`, [
      language,
      language,
      tsqueryString,
    ]);


  // Check if any FTS results exist
  const ftsExists = await fullTextQuery
    .clone()
    .clearOrder()
    .limit(1);

  const exactBoostCases = fields
    .map((f, i) => `WHEN ${f}::text ILIKE ? THEN ${10 / (i + 1)}`)
    .join(' ');
  const exactBoostBindings = fields.map(() => searchTerm);

  const positionScoreFragments = fields
    .map(
      (f, i) =>
        `CASE WHEN position(lower(?) in lower(${f}::text)) > 0 THEN ${1 / (i + 1)} / position(lower(?) in lower(${f}::text)) ELSE 0 END`
    );
  const positionScoreBindings = fields.flatMap(() => [searchTerm, searchTerm]);

  const positionScoreExpr = positionScoreFragments.join(' + ');

  if (ftsExists.length > 0) {
    context.params.knex = fullTextQuery
      .select(
        knex.raw(
          `(
              ts_rank(to_tsvector(?, ${tsvectorExpr}), to_tsquery(?, ?))
              + CASE ${exactBoostCases} ELSE 0 END
              + (${positionScoreExpr})
            ) AS rank`,
          [language, language, tsqueryString, ...exactBoostBindings, ...positionScoreBindings]
        )
      );

    return context;
  }

  const trigramWeighted = fields
    .map((f, i) => knex.raw(`? * similarity(??::text, ?)`, [1 / (i + 1), f, searchTerm]))
    .map((r) => r.toString())
    .join(' + ');

  context.params.knex = baseQuery
    .clone()
    .where(function () {
      fields.forEach((f) => {
        this.orWhereRaw('similarity(??::text, ?) > 0.2', [f, searchTerm]);
      });
    })
    .select(
      knex.raw(
        `(${trigramWeighted} + CASE ${exactBoostCases} ELSE 0 END + (${positionScoreExpr})) AS rank`,
        [...exactBoostBindings, ...positionScoreBindings]
      )
    );

  return context;
};