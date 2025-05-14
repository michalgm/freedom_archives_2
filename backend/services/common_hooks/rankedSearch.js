import tsquery from "pg-tsquery";

const parser = tsquery();

const FULLTEXT_WEIGHT = 1000;
const TRIGRAM_WEIGHT = 100;
const EXACT_MATCH_BOOST = 10000;
const POSITION_BOOST_WEIGHT = 5;
const SIMILARITY_THRESHOLD = 0.2;

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
  const language = 'english';

  const searchTerm = query?.$fullText?.toLowerCase() || context?.params?._rankedSearch || '';
  delete query.$fullText;

  if (!searchTerm) return context;
  context.params._rankedSearch = searchTerm;

  const knex = context.app.get('postgresqlClient');
  const params = await context.service.sanitizeQuery(context.params);
  const baseQuery = context.service
    .createQuery({ ...params, query: params });

  // Always apply prefix matching by default on all terms
  const tsqueryString = parser(applyBasicPrefixing(searchTerm));

  const exactBoostCases = knex.raw(`WHEN search_text = ? THEN ${EXACT_MATCH_BOOST}`, [searchTerm]).toString();
  console.log(context.service.fullName);

  const positionScoreExpr = knex.raw(
    `CASE WHEN position(? in search_text) > 0 THEN ${(POSITION_BOOST_WEIGHT)}::float / position(? in search_text) ELSE 0 END`,
    [searchTerm, searchTerm]
  ).toString();

  const trigram = knex.raw(`word_similarity(search_text, ?)`, [searchTerm]).toString();
  context.params.knex = baseQuery
    .clone()
    .with('ts_query', knex.raw(`select to_tsquery(?, ?) as query`, [language, tsqueryString]))
    .where(function () {
      this.whereRaw(`fulltext @@ (select query from ts_query)`)
        .orWhereRaw(`${trigram} > ${SIMILARITY_THRESHOLD}`);
    })
    .select(
      knex.raw(
        `(
          CASE
            WHEN fulltext @@ (select query from ts_query) THEN 
                 ${FULLTEXT_WEIGHT} * ts_rank(fulltext, (select query from ts_query))
            ELSE 
              ${TRIGRAM_WEIGHT} * ${trigram}
            END
            + CASE ${exactBoostCases} ELSE 0 END
            + (${positionScoreExpr} ) 
        ) AS rank`
      )
    );
  ;
  // context.result = [];
  // return context;
  // console.log(context.params.knex.toString());
  return context;
};