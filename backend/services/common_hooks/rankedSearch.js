import tsquery from "pg-tsquery";

const parser = tsquery();

const FULLTEXT_WEIGHT = 10000;
const TRIGRAM_WEIGHT = 100;
const FIELD_ORDER_WEIGHT = 10; // boost multiplier for earlier fields
const FIELD_MATCH_BOOST_BASE = 10;
const POSITION_BOOST_WEIGHT = 1;
const SIMILARITY_THRESHOLD = 0.1;

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

  const baseQuery = context.service
    .createQuery({ ...context.params, query });

  // Always apply prefix matching by default on all terms
  const tsqueryString = parser(applyBasicPrefixing(searchTerm));

  const tsvectorExpr = fields.map((f) => `coalesce(${f}::text, '')`).join(` || ' ' || `);

  const exactBoostCases = fields
    .map((f, i) => `WHEN ${f}::text ILIKE ? THEN ${(FIELD_MATCH_BOOST_BASE * FIELD_ORDER_WEIGHT) / (i + 1)}`)
    .join(' ');
  const exactBoostBindings = fields.map(() => searchTerm);

  const positionScoreFragments = fields
    .map(
      (f, i) =>
        `CASE WHEN position(lower(?) in lower(${f}::text)) > 0 THEN ${(POSITION_BOOST_WEIGHT * FIELD_ORDER_WEIGHT) / (i + 1)} / position(lower(?) in lower(${f}::text)) ELSE 0 END`
    );
  const positionScoreBindings = fields.flatMap(() => [searchTerm, searchTerm]);

  const positionScoreExpr = positionScoreFragments.join(' + ');

  const trigramWeighted = fields
    .map((f, i) => knex.raw(`? * word_similarity(??::text, ?)`, [(FIELD_ORDER_WEIGHT / (i + 1)), f, searchTerm]))
    .map((r) => r.toString())
    .join(' + ');

  context.params.knex = baseQuery
    .clone()
    .where(function () {
      this.whereRaw(`to_tsvector(?, ${tsvectorExpr}) @@ to_tsquery(?, ?)`, [
        language,
        language,
        tsqueryString,
      ]).orWhere(function () {
        fields.forEach((f) => {
          this.orWhereRaw(`word_similarity(??::text, ?) > ${SIMILARITY_THRESHOLD}`, [f, searchTerm]);
        });
      })
        .whereRaw(
          `${trigramWeighted} IS NOT NULL`,
        );
    })
    .select(
      knex.raw(
        `(
          CASE
            WHEN to_tsvector(?, ${tsvectorExpr}) @@ to_tsquery(?, ?) THEN 
                 ${FULLTEXT_WEIGHT} * ts_rank(to_tsvector(?, ${tsvectorExpr}), to_tsquery(?, ?))
            ELSE 
              ${TRIGRAM_WEIGHT} * ${trigramWeighted}
            END
            + CASE ${exactBoostCases} ELSE 0 END
            + (${positionScoreExpr} ) 
        ) AS rank`,
        [language, language, tsqueryString, language, language, tsqueryString, ...exactBoostBindings, ...positionScoreBindings]
      )
    );
  ;

  return context;
};