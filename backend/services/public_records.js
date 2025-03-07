const { Service } = require("feathers-knex");
const tsquery = require("pg-tsquery")();

const archive_id = 1;
class PublicRecords extends Service {
  constructor(options) {
    super({
      ...options,
      name: "public_search.records_view",
      filters: {
        $fullText: (v) => v,
      },
    });
    // this.find = this.find.bind(this);
  }
}

module.exports = function (app) {
  const options = {
    id: "record_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
    authentication: false,
  };

  // Initialize our service with any options it requires
  app.use("/public_records", new PublicRecords(options, app), {
    methods: ["find"],
  });

  const service = app.service("public_records");

  service.hooks(hooks);
};

const fullTextSearch = (context) => {
  context.params.query.archive_id = archive_id;
  if (context.params.query.$fullText !== undefined) {
    const { $fullText, ...query } = context.params.query;
    const knex = context.service.createQuery({ ...context.params, query });
    if ($fullText) {
      const fullTextQuery = tsquery($fullText);
      context.fullText = fullTextQuery;
      knex
        .clearOrder()
        .select(context.service.Model.raw(`ts_rank_cd(fulltext, to_tsquery('english', ?)) AS score`, [fullTextQuery]))
        .whereRaw(`fulltext @@ to_tsquery('english', ?)`, [fullTextQuery])
        .orderBy([{ column: "score", order: "desc" }, { column: "title" }]);
      // knex.orderBy("title");
      // knex.orderBy([{ column: "score", order: "desc" }]);
      // knex.orderBy("score", "desc");
    }
    context.params.knex = knex;
  }
};

const lookupFilters = async ({ params: { knex, provider }, result, service: { Model } }) => {
  // console.log('AFTER FIND');
  if (!provider) {
    return;
  }
  console.time("filters");
  // const ids = (await knex.clone().clearSelect().clearOrder().select("record_id")).map(
  //   ({ record_id }) => `(${record_id})`
  // );
  // const { sql, bindings } = knex.clone().clearSelect().clearOrder().select("record_id").toSql().toNative();
  // console.log(knex.clone().clearSelect().clearOrder().select("record_id").toSql().toNative());
  // await trx.raw(
  //   `create temp table search_results3  on commit drop as ${ids}`
  // );
  // const subquery = `select record_id from search_results3`;
  // console.log(res);
  // const subquery = ids;
  // const query = Model.with("filtered_records", ["record_id"], Model.raw(`values ${ids}`))
  const recordsQuery = knex.clone().clearSelect().clearOrder().from("public_search.records").select("record_id");
  const aggregatedDataQuery = Model.select().unionAll([
    Model.select(Model.raw("li.type::text || '_ids' AS type, li.item::text AS item, li.list_item_id"))
      .count()
      .from("public_search.records_to_list_items AS r")
      .join("public_search.list_items AS li", "r.list_item_id", "li.list_item_id")
      .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
      .whereIn("li.type", ["keyword", "subject", "author"])
      .groupBy("li.type", "li.item", "li.list_item_id"),
    Model.select(Model.raw("'year' AS type, year::text AS item, 0 as list_item_id"))
      .count()
      .from("public_search.records_view AS r")
      .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
      .whereNotNull("year")
      .groupBy("year"),

    Model.select(Model.raw("'title' AS type, title::text, 0"))
      .count()
      .from("public_search.records_view AS r")
      .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
      .groupBy("title")
      .havingRaw("COUNT(*) > 1"),

    Model.select(Model.raw("'collection_id' AS type, collection_name::text, collection_id"))
      .count()
      .from("public_search.records_view AS r")
      .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
      .groupBy("collection_id", "collection_name"),

    Model.select(Model.raw("'media_type' AS type, media_type::text, 0"))
      .count()
      .from("public_search.records_view AS r")
      .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
      .whereNot("media_type", "")
      .groupBy("media_type"),

    Model.select(Model.raw("'format' AS type, format::text, 0"))
      .count()
      .from("public_search.records_view AS r")
      .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
      .whereNot("format", "")
      .groupBy("format"),
  ]);

  const query = Model.with("filtered_records", recordsQuery)
    .with("aggregated_data", aggregatedDataQuery)
    .select(
      Model.raw(`
      type AS type, 
      jsonb_agg(jsonb_build_array(item, count, list_item_id) ORDER BY count DESC) AS values
    `)
    )
    .from("aggregated_data")
    .groupBy("type");

  //   const query = Model.with("filtered_records", knex.clone().clearSelect().clearOrder().select("record_id")).select(
  //     Model.raw(`

  //     li.type || '_ids',
  //     jsonb_agg(jsonb_build_array(li.item, count, li.list_item_id) ORDER BY count DESC) AS values
  // FROM
  //       ( select li.type::text, li.item::text, li.list_item_id, count(*) as count from
  // public_search.records_to_list_items r
  // JOIN public_search.list_items li ON r.list_item_id = li.list_item_id
  // AND li.type IN ('keyword', 'subject', 'author')
  //       join filtered_records using (record_id)
  // GROUP BY li.type, li.item, li.list_item_id
  // union all

  //       SELECT 'year', year::text as item ,0 ,  COUNT(*) as count

  //       FROM public_search.records_view r
  //         join filtered_records using (record_id)
  //       GROUP BY year
  //       union all
  //     SELECT 'title', title::text, 0, COUNT(*) as count
  //     FROM public_search.records_view r
  //       join filtered_records using (record_id)
  //     GROUP BY title HAVING count(*) > 1
  //     union all
  //       SELECT 'collection', collection_name::text, collection_id, COUNT(*) as count
  //   FROM public_search.records_view r
  //     join filtered_records using (record_id)
  //       GROUP BY collection_id, collection_name
  //       union all
  //         SELECT 'media_type', media_type::text, 0, COUNT(*) as count
  //   FROM public_search.records_view r
  //     join filtered_records using (record_id)
  //   where media_type != ''
  //   GROUP BY media_type
  //   union all
  //     SELECT 'format', format::text, 0, COUNT(*) as count
  //   FROM public_search.records_view r
  //   join filtered_records using (record_id)
  //   where format != ''
  //   GROUP BY format

  // ) li group by li.type
  // `)
  //   );
  // console.log(query.toString());
  const filters = await query;
  console.timeEnd("filters");
  result.filters = filters.reduce((acc, { type, values }) => {
    acc[type] = values;
    return acc;
  }, {});
};

// UNION ALL

// SELECT
//   'media_type' as type,
//   jsonb_agg(jsonb_build_array(media_type::text, count) ORDER BY count DESC) as values
// FROM (
//   SELECT media_type, COUNT(*) as count
//   FROM public_search.records
//   where media_type != ''
//   and record_id IN (${subquery})
//   GROUP BY media_type
// ) mt

//  UNION ALL
// SELECT
//     'subject_ids' as type,
//     jsonb_agg(jsonb_build_array(li.item, count, li.list_item_id) ORDER BY count DESC) as values
// FROM (
//     SELECT unnest(subject_ids) as list_item_id, COUNT(*) as count
//     FROM public_search.records
//     WHERE record_id IN (${subquery})
//     GROUP BY list_item_id
// ) counts
// JOIN public_search.list_items li ON li.list_item_id = counts.list_item_id and li.archive_id = ${archive_id}
// WHERE li.type = 'subject'

//  UNION ALL
// SELECT
//     'author_ids' as type,
//     jsonb_agg(jsonb_build_array(li.item, count, li.list_item_id) ORDER BY count DESC) as values
// FROM (
//     SELECT unnest(author_ids) as list_item_id, COUNT(*) as count
//     FROM public_search.records
//     WHERE record_id IN (${subquery})
//     GROUP BY list_item_id
// ) counts
// JOIN public_search.list_items li ON li.list_item_id = counts.list_item_id and li.archive_id = ${archive_id}
// WHERE li.type = 'author'

// UNION ALL
// SELECT
// 'collection_id' as type,
// jsonb_agg(jsonb_build_array(collection_name, count, collection_id) ORDER BY count DESC) as values
// FROM (
//   SELECT collection_id, COUNT(*) as count
//   FROM public_search.records
//   WHERE record_id IN (${subquery})
//       GROUP BY collection_id
//     ) counts
//      JOIN collections using (collection_id)

//     UNION ALL
//     SELECT
//       'year' as type,
//       jsonb_agg(jsonb_build_array(year, count) ORDER BY year) as values
//     FROM (
//       SELECT year, COUNT(*) as count
//       FROM public_search.records
//       WHERE record_id IN (${subquery})
//       GROUP BY year
//     ) b

//     UNION ALL

//     SELECT
//     'keyword_ids' as type,
//     jsonb_agg(jsonb_build_array(li.item, count, li.list_item_id) ORDER BY count DESC) as values
// FROM (
//     SELECT unnest(keyword_ids) as list_item_id, COUNT(*) as count
//     FROM public_search.records
//     WHERE record_id IN (${subquery})
//     GROUP BY list_item_id
// ) counts
// JOIN public_search.list_items li ON li.list_item_id = counts.list_item_id and li.archive_id = ${archive_id}
// WHERE li.type = 'keyword'
// UNION ALL
// SELECT
//     'title' as type,
//     jsonb_agg(jsonb_build_array(title, count) ORDER BY count DESC) as values
// FROM (
//     SELECT title, COUNT(*) as count
//     FROM public_search.records
//     WHERE record_id IN (${subquery})
//     GROUP BY title HAVING count(*) > 1
// ) t

// `
//     )
//   )

const getNonDigitizedTotal = async (context) => {
  const {
    params: { query, provider, ...params },
    result,
  } = context;
  if (provider && query.has_digital) {
    console.time("nonDigitized");
    const updatedQuery = { ...query, $select: ["record_id"], has_digital: false, $limit: 0 };
    const res = await context.service.find({ ...params, query: updatedQuery });
    result.nonDigitizedTotal = res.total;
    console.timeEnd("nonDigitized");
  }
};

const hooks = {
  before: {
    find: [fullTextSearch],
  },
  after: {
    find: [lookupFilters, getNonDigitizedTotal],
  },
};

//     UNION ALL
//           SELECT
//   'authors' as type,
//   jsonb_agg(jsonb_build_array(value->>'item', count, (value->>'list_item_id')::integer) ORDER BY count DESC) as values
// FROM (
//   SELECT jsonb_array_elements(authors) as value, COUNT(*) as count
//   FROM public_records
//   WHERE record_id IN (${subquery})
//   GROUP BY value
// ) a
// UNION ALL
//           SELECT
//   'publisher' as type,
//   jsonb_agg(jsonb_build_array(value->>'item', count, (value->>'list_item_id')::integer) ORDER BY count DESC) as values
// FROM (
//   SELECT publisher as value, COUNT(*) as count
//   FROM public_records
//   WHERE record_id IN (${subquery})
//   GROUP BY value
// ) a

// UNION ALL
//           SELECT
//   'program' as type,
//   jsonb_agg(jsonb_build_array(value->>'item', count, (value->>'list_item_id')::integer) ORDER BY count DESC) as values
// FROM (
//   SELECT program as value, COUNT(*) as count
//   FROM public_records
//   WHERE record_id IN (${subquery})
//   GROUP BY value
// ) a

// UNION ALL
//           SELECT
//   'producers' as type,
//   jsonb_agg(jsonb_build_array(value->>'item', count, ((value->>'list_item_id')::integer)::integer) ORDER BY count DESC) as values
// FROM (
//   SELECT jsonb_array_elements(producers) as value, COUNT(*) as count
//   FROM public_records
//   WHERE record_id IN (${subquery})
//   AND producers->>'item' is not null
//   GROUP BY value
// ) a

// UNION ALL
// SELECT
//   'year' as type,
//   jsonb_agg(jsonb_build_array(year, count) ORDER BY count DESC) as values
// FROM (
//   SELECT year, COUNT(*) as count
//   FROM public_records
//   WHERE record_id IN (${subquery})
//   GROUP BY year
// ) b

// UNION ALL

// SELECT
//   'collection' as type,
//   jsonb_agg(jsonb_build_array(collection_name, count, collection_id) ORDER BY count DESC) as values
// FROM (
//   SELECT collection_id, collection_name, COUNT(*) as count
//   FROM public_records
//   WHERE record_id IN (${subquery})
//   GROUP BY collection_id, collection_name
