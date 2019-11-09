const { authenticate } = require('@feathersjs/authentication').hooks;

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [context => {
      // WHERE to_tsvector(document_text) @@ to_tsquery('jump & quick');
      if (context.params.query.$fullText !== undefined) {
        const { $fullText, ...query } = context.params.query;
        const knex = context.service.createQuery({ ...context.params, query });
        if ($fullText) {
          knex.select(context.service.Model.raw(`ts_rank_cd(fulltext, websearch_to_tsquery('english', ?)) AS score`, [$fullText]));
          knex.whereRaw(`fulltext @@ websearch_to_tsquery('english', ?)`, [$fullText]);
          knex.orderBy('score', 'desc');
        }
        context.params.knex = knex;
      }

    }],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [context => {
      if (context.params.knex) {
        context.result.query = context.params.knex.toString();
      }
    }],
    find: [],
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
