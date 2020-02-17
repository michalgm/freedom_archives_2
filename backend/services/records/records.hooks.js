const { authenticate } = require('@feathersjs/authentication').hooks;
const tsquery = require('pg-tsquery')();
const { hooks: { transaction } } = require('feathers-knex');

const refreshRecordsView = async (context) => {
  const { id, method, service: { Model }, params: { knex, transaction: { trx } } } = context;

  if (['update', 'patch', 'remove'].includes(method)) {
    await trx('unified_records')
      .where('record_id', id)
      .delete();
  }
  if (['update', 'patch', 'create'].includes(method)) {
    const [data] = await trx('records_view')
      .where('record_id', id)
      .select();
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key] === 'object' && !key.includes('_search')) {
        data[key] = JSON.stringify(data[key]);
      }
    });
    await trx('unified_records')
      .insert(data);
  }
};

const maskView = context => {
  context.service.table = 'records';
  return context;
};

const fullTextSearch = context => {
  if (context.params.query.$fullText !== undefined) {
    const { $fullText, ...query } = context.params.query;
    const knex = context.service.createQuery({ ...context.params, query });
    if ($fullText) {
      const fullTextQuery = tsquery($fullText);
      context.fullText = fullTextQuery;
      knex.select(context.service.Model.raw(`ts_rank_cd(fulltext, to_tsquery('english', ?)) AS score`, [fullTextQuery]));
      knex.whereRaw(`fulltext @@ to_tsquery('english', ?)`, [fullTextQuery]);
      knex.orderBy('score', 'desc');
    }
    context.params.knex = knex;
  }
};
const lookupFilters = async ({ params: { knex, query: { $fullText } }, result, service: { Model } }) => {
  console.log('AFTER FIND');

  if ($fullText !== undefined) {
    const ids = await knex
      .clearSelect()
      .clearOrder()
      .select('record_id')
      .toString();

    const filters = await Model.raw(`
      select
        type, array_agg(array_to_json(array[item, count::text]) order by count desc) as values
      from (
        select
          item, type, count(*) as count
        from records_to_list_items a
        join list_items b
          using (list_item_id)
        join (${ids}) c
          using (record_id)
        group by item, type
        order by type
      ) a
      group by type;
    `);
    result.filters = filters.rows;
  }
};
const updateRelations = async (context) => {
  const { id, data, params: { transaction: { trx } } } = context;
  console.log(data);
  for (const type of ['subjects', 'keywords', 'producers', 'authors']) {
    if (data[type] !== undefined) {
      console.log('UPDATE', data);

      const ids = trx.from('records_to_list_items')
        .join('list_items', 'records_to_list_items.list_item_id', 'list_items.list_item_id')
        .where('type', type.replace(/s$/, ''))
        .andWhere('record_id', id)
        .select('records_to_list_items.list_item_id');

      await trx('records_to_list_items')
        .whereIn('list_item_id', ids)
        .delete();

      await trx('records_to_list_items')
        .insert(data[type].map(({ list_item_id }) => ({ list_item_id, record_id: id })));
      delete context.data[type];
      console.log('UPDATE', context.data);

    }
  }
  if (!Object.keys(data).length) {
    context.result = await trx('records')
      .where('record_id', id)
      .select();
  }
  console.log('UPDATE DONE', context.result);
  return context;
};


module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [fullTextSearch],
    get: [],
    create: [transaction.start(), maskView, updateRelations],
    update: [transaction.start(),],
    patch: [transaction.start(), maskView, updateRelations],
    remove: [transaction.start(), maskView]
  },

  after: {
    all: [context => {
      if (context.params.knex) {
        context.result.query = context.params.knex.toString();
      }
      if (context.fullText) {
        context.result.fullText = context.fullText;
      }
      context.service.table = 'unified_records';
      console.log('AFTER ALL');
    }],
    find: [lookupFilters],
    get: [],
    create: [refreshRecordsView, transaction.end()],
    update: [refreshRecordsView, transaction.end()],
    patch: [refreshRecordsView, transaction.end()],
    remove: [refreshRecordsView, transaction.end()]
  },

  error: {
    all: [context => {
      context.service.table = 'unified_records';
    }],
    find: [],
    get: [],
    create: [transaction.rollback()],
    update: [transaction.rollback()],
    patch: [transaction.rollback()],
    remove: [transaction.rollback()]
  }
};
