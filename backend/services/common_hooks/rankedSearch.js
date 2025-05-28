import tsquery from "pg-tsquery";

const parser = tsquery();

const FULLTEXT_WEIGHT = 1000;
const TRIGRAM_WEIGHT = 100;
const EXACT_MATCH_BOOST = 10000;
const POSITION_BOOST_WEIGHT = 5;

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

const isNumeric = /^\d+$/;

const applyWhere = (qb, { idField, idValue, searchTerm }) => {
  qb.where(function () {
    // exact-ID branch
    this.where(function () {
      this.whereRaw("id_check.exists = true");
      this.where(`${idField}`, idValue);
    })
      // fallback branch
      .orWhere(function () {
        this.whereRaw("id_check.exists = false");
        this.whereRaw("fulltext @@ ts_query.query");
        if (idValue == null) {
          this.orWhereRaw("search_text %> ?", [searchTerm]);
        }
      });
  });
};

export const rankedSearch = async (context) => {
  const { query = {} } = context.params;
  const language = 'english';

  const searchTerm = query?.$fullText?.toLowerCase() || context?.params?._rankedSearch || '';
  delete query.$fullText;

  const params = await context.service.sanitizeQuery(context.params);
  if (!searchTerm) return context;
  context.params._rankedSearch = searchTerm;

  const knex = context.app.get('postgresqlClient');
  const baseQuery = context.service
    .createQuery({ ...params, query: params });

  const { id: idField, name: tableName } = context.service.getOptions({});

  const idValue = isNumeric.test(searchTerm) ? parseInt(searchTerm, 10) : null;

  const tsqueryString = parser(applyBasicPrefixing(searchTerm));

  const exactBoostCases = knex.raw(`WHEN search_text = ? THEN ${EXACT_MATCH_BOOST}`, [searchTerm]).toString();

  const positionScoreExpr = knex.raw(
    `CASE WHEN position(? in search_text) > 0 THEN ${(POSITION_BOOST_WEIGHT)}::float / position(? in search_text) ELSE 0 END`,
    [searchTerm, searchTerm]
  ).toString();

  const trigram = knex.raw(`word_similarity(search_text, ?)`, [searchTerm]).toString();

  const idTest = idValue ? knex.raw(`"${idField}" = ?`, [idValue]).toString() : 'false';

  const rankedQuery = baseQuery
    .clone()
    .with('ts_query', knex.raw(`select to_tsquery(?, ?) as query`, [language, tsqueryString]))
    .with(
      "id_check",
      idValue !== null ? knex.raw(
        `SELECT EXISTS(
            SELECT 1 FROM "${tableName}" 
            WHERE "${idField}" = ?
          ) AS exists`,
        [idValue]
      ) : knex.raw(`SELECT false AS exists`)
    )
    .crossJoin('ts_query')
    .crossJoin('id_check')
    .modify(q => applyWhere(q, { idField, idValue, searchTerm }))
    .select(
      knex.raw(
        `(
          CASE WHEN ${idTest} THEN 1
              ELSE
          CASE
            WHEN fulltext @@ ts_query.query THEN 
              ${FULLTEXT_WEIGHT} * ts_rank(fulltext, ts_query.query)
            ELSE 
              ${idValue !== null ? '0' : `${TRIGRAM_WEIGHT} * ${trigram}`}
            END
            + CASE ${exactBoostCases} ELSE 0 END
            + (${positionScoreExpr} ) 
            END ) as rank
        `,
      )
    );

  context.params.knex = rankedQuery;

  return context;
};