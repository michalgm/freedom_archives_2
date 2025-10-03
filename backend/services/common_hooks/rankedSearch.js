import tsquery from "pg-tsquery";

const parser = tsquery();

const FULLTEXT_WEIGHT = 1000;
const CALL_NUMBERS_WEIGHT = 500;
const TRIGRAM_WEIGHT = 100;
const FULL_TERM_MATCH_BOOST = 200;
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


function getFulltextRank() {
  return `${FULLTEXT_WEIGHT} * COALESCE(ts_rank_cd(fulltext, ts_query.query, 1), 0)`;
}

function getTrigramRank(knex, searchTerm) {
  return `${TRIGRAM_WEIGHT} * ${knex.raw('word_similarity(search_text, ?)', [searchTerm])}`;
}

function getCallNumbersBoost(knex, tableName, searchTerm) {
  return tableName.match(/(records|collections)/)
    ? knex.raw(
      `CASE 
          WHEN ${tableName.match('record') ? `EXISTS( SELECT 1 FROM unnest(call_numbers) AS elem WHERE elem ILIKE ? )` : `call_number ILIKE ?`} THEN ${CALL_NUMBERS_WEIGHT}
          ELSE 0 
         END`,
      [`${searchTerm}%`]
    ).toString()
    : '0';
}

function getFullTermBoost(knex, searchTerm) {
  return knex.raw(`CASE WHEN search_text ilike ? THEN ${FULL_TERM_MATCH_BOOST} ELSE 0 END`, [`%${searchTerm}%`]).toString();
}

function getPositionScore(knex, searchTerm) {
  return knex.raw(
    `CASE WHEN position(? in search_text) > 0 THEN ${(POSITION_BOOST_WEIGHT)}::float / position(? in search_text) ELSE 0 END`,
    [searchTerm, searchTerm]
  ).toString();
}

// Compose rank expression based on enabled facets
function buildRankExpr({ useFulltext, useTrigram, useCallNumbers, useFullTerm, usePosition }, knex, tableName, tsqueryString, searchTerm) {
  const parts = [];
  if (useFulltext) parts.push(getFulltextRank());
  if (useTrigram) parts.push(getTrigramRank(knex, searchTerm));
  if (useCallNumbers) parts.push(getCallNumbersBoost(knex, tableName, searchTerm));
  if (useFullTerm) parts.push(getFullTermBoost(knex, searchTerm));
  if (usePosition) parts.push(getPositionScore(knex, searchTerm));
  return parts.length ? parts.join(' + ') : '0';
}

function getRankSelect(knex, useIdCheck, idField, idValue, rankExpr) {
  if (useIdCheck && idValue) {
    return knex.raw(
      `(
        CASE WHEN "${idField}" = ? THEN 1000000
        ELSE (${rankExpr})
        END
      ) as rank`, [idValue]
    );
  }
  return knex.raw(`(${rankExpr}) as rank`);
}


// const applyWhere = (qb, { idField, idValue, searchTerm }) => {
//   qb.where(function () {
//     // exact-ID branch
//     this.where(function () {
//       this.whereRaw("id_check.exists = true");
//       this.where(`${idField}`, idValue);
//     })
//       // fallback branch
//       .orWhere(function () {
//         this.whereRaw("id_check.exists = false");
//         this.whereRaw("fulltext @@ ts_query.query");
//         if (idValue == null) {
//           this.orWhereRaw("search_text %> ?", [searchTerm]);
//         }
//       });
//   });
// };

function buildWhere(qb, { idField, idValue, searchTerm, useIdCheck = true, useFuzzy = true }) {
  const includeId = useIdCheck && idValue !== null;
  qb.where(function () {
    this.where(function () {
      if (includeId) {
        this.whereRaw("id_check.exists = true");
        this.where(`${idField}`, idValue);
      }
    })
      .orWhere(function () {
        if (includeId) {
          this.whereRaw("id_check.exists = false");
        }
        this.whereRaw("fulltext @@ ts_query.query");
        if (useFuzzy && idValue == null) {
          this.orWhereRaw("search_text %> ?", [searchTerm]);
        }
      });
  });
}

// Usage in rankedSearch:
export const rankedSearch = async (context) => {
  const { query = {} } = context.params;
  const isPublic = context.path.includes('/public/');
  const useIdCheck = !isPublic;
  const useFuzzy = !isPublic;
  const language = 'english';

  const searchTerm = (query?.$fullText || context?.params?._rankedSearch || '').toLowerCase().trim();
  delete query.$fullText;

  const params = await context.service.sanitizeQuery(context.params);
  if (!searchTerm) return context;
  context.params._rankedSearch = searchTerm;

  const knex = context.app.get('postgresqlClient');
  const baseQuery = context.service.createQuery({ ...params, query: params });

  const { id: idField, name: tableName } = context.service.getOptions({});
  const idValue = isNumeric.test(searchTerm) ? parseInt(searchTerm, 10) : null;
  const tsqueryString = parser(applyBasicPrefixing(searchTerm));

  const rankExpr = buildRankExpr(
    {
      useFulltext: !isPublic,
      useTrigram: useFuzzy,
      useCallNumbers: !isPublic,
      useFullTerm: true,
      usePosition: useFuzzy,
    },
    knex,
    tableName,
    tsqueryString,
    searchTerm
  );

  let rankedQuery = baseQuery.clone()
    .with('ts_query', knex.raw(`select to_tsquery(?, ?) as query`, [language, tsqueryString]))
    .crossJoin('ts_query');

  if (useIdCheck) {
    rankedQuery = rankedQuery
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
      .crossJoin('id_check');
  }

  rankedQuery = rankedQuery
    .modify(q => buildWhere(q, { idField, idValue, searchTerm, useIdCheck, useFuzzy }))
    .select(
      getRankSelect(knex, useIdCheck, idField, idValue, rankExpr)
    );


  context.params.knex = rankedQuery;
  return context;
};
