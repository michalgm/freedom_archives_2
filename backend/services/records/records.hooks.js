const { authenticate } = require('@feathersjs/authentication').hooks;
const tsquery = require('pg-tsquery')();
const {
  hooks: { transaction },
} = require('feathers-knex');
const {
  setUser,
  updateListItemRelations,
  maskView,
  unMaskView,
  refreshView,
} = require('../common_hooks');

const fullTextSearch = context => {
  if (context.params.query.$fullText !== undefined) {
    const { $fullText, ...query } = context.params.query;
    const knex = context.service.createQuery({ ...context.params, query });
    if ($fullText) {
      const fullTextQuery = tsquery($fullText);
      context.fullText = fullTextQuery;
      knex.select(
        context.service.Model.raw(
          `ts_rank_cd(fulltext, to_tsquery('english', ?)) AS score`,
          [fullTextQuery]
        )
      );
      knex.whereRaw(`fulltext @@ to_tsquery('english', ?)`, [fullTextQuery]);
      knex.orderBy('score', 'desc');
    }
    context.params.knex = knex;
  }
};
const lookupFilters = async ({
  params: {
    knex,
    query: { $fullText },
    // transaction: { trx },
  },
  result,
  service: { Model },
}) => {
  console.log('AFTER FIND');

  if ($fullText !== undefined) {
    const ids = await knex
      .clearSelect()
      .clearOrder()
      .select('record_id')
      .toString();

    // await trx.raw(
    //   `create temp table search_results3  on commit drop as ${ids}`
    // );
    // const subquery = `select record_id from search_results3`;
    // console.log(res);
    const subquery = ids;

    const filters = (
      await Promise.all(
        [
          `select
          type, array_agg(jsonb_build_array(item, count::text) order by count desc) as values
          from (
            select
              item, type, count(*) as count
            from records_to_list_items a
            join list_items b
            using (list_item_id)
            where record_id in (${subquery})
            group by item, type
            order by type
          ) a group by type`,
          `select 'year' as type, array_agg(jsonb_build_array(year, count::text) order by count desc, year) as values from (
          select year::text, count(*) as count
          from records
          where record_id in (${subquery})
          group by year
        ) a`,
          `select 'collection' as type, array_agg(jsonb_build_array(collection_name, count::text, collection_id) order by count desc, collection_name) as values from (
          select collection_id, max(collection_name) as collection_name, count(*) as count
          from records
          join collections using (collection_id)
          where record_id in (${subquery})
          group by collection_id
        ) a`,
          `select 'title' as type, array_agg(jsonb_build_array(title, count::text) order by count desc, title) as values from (
          select title, count(*) as count
          from records
          where record_id in (${subquery})
          group by title
        ) a`,
        ].flatMap(async query => (await Model.raw(query)).rows.flat())
      )
    ).flat();

    // await trx.raw(`drop table search_results3 `);

    // console.log(filters);
    result.filters = filters;
  }
};

const updateRelations = async context => {
  const {
    id,
    params: {
      transaction: { trx },
    },
    data,
  } = context;

  if (!Object.keys(data).length) {
    context.result = await trx('records').where('record_id', id).select();
  }
  if ('collection' in data) {
    data.collection_id = data.collection ? data.collection.collection_id : null;
    delete data.collection;
  }
  return context;
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [fullTextSearch],
    get: [],
    create: [
      transaction.start(),
      maskView,
      setUser,
      updateListItemRelations,
      updateRelations,
    ],
    update: [transaction.start()],
    patch: [
      transaction.start(),
      maskView,
      setUser,
      updateListItemRelations,
      updateRelations,
    ],
    remove: [transaction.start(), maskView],
  },

  after: {
    all: [
      unMaskView,
      context => {
        if (context.params.knex) {
          context.result.query = context.params.knex.toString();
        }
        if (context.fullText) {
          context.result.fullText = context.fullText;
        }
      },
    ],
    find: [lookupFilters],
    get: [],
    create: [refreshView, transaction.end()],
    update: [refreshView, transaction.end()],
    patch: [refreshView, transaction.end()],
    remove: [refreshView, transaction.end()],
  },

  error: {
    all: [unMaskView],
    find: [],
    get: [],
    create: [transaction.rollback()],
    update: [transaction.rollback()],
    patch: [transaction.rollback()],
    remove: [transaction.rollback()],
  },
};
