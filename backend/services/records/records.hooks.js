const { authenticate } = require('@feathersjs/authentication').hooks;
const tsquery = require('pg-tsquery')();

const refreshRecordsView = async (context) => {
  const { id, method, service: { Model } } = context;
  await Model.transaction(async trx => {
    try {
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
          if (data[key] && typeof data[key] === 'object') {
            data[key] = JSON.stringify(data[key]);
          }
        });
        await trx('unified_records')
          .insert(data);
      }
    } catch (err) {
      console.error(err);
    }
  });
};

const maskView = context => {
  context.service.table = 'records';
  return context;
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [context => {
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

    }],
    get: [],
    create: [maskView],
    update: [],
    patch: [maskView],
    remove: [maskView]
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

    }, refreshRecordsView],
    find: [
      async context => {
        const { result, service: { Model } } = context;
        if (context.params.query.$fullText !== undefined) {
          const ids = await context.params.knex
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
      }
    ],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
