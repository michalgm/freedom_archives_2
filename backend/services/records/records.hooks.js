const { authenticate } = require('@feathersjs/authentication').hooks;
const tsquery = require('pg-tsquery')();

const refreshRecordsView = async (context) => {
  const { Model } = context.service;
  await Model.raw("drop table unified_records");
  await Model.raw("create table unified_records as select * from records_view");
  await Model.raw("CREATE INDEX records_fulltext_index on unified_records using GIN (fulltext)");
};

const maskView = context => {
  context.service.table = 'records';
  return context;
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [context => {
      // WHERE to_tsvector(document_text) @@ to_tsquery('jump & quick');
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

    }],
    find: [],
    get: [],
    create: [refreshRecordsView],
    update: [refreshRecordsView],
    patch: [refreshRecordsView],
    remove: [refreshRecordsView]
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
