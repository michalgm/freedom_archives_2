const { Service } = require('feathers-knex');
const { authenticate } = require('@feathersjs/authentication').hooks;
const {
  hooks: { transaction },
} = require('feathers-knex');
const {setUser, updateListItemRelations, maskView, unMaskView, refreshView} = require('./common_hooks');

class Collections extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'unified_collections',
    });
  }
}

module.exports = function (app) {
  const options = {
    id: 'collection_id',
    Model: app.get('knexClient'),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/collections', new Collections(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('collections');

  
  service.hooks({
    before: {
      all: [authenticate('jwt')],
      create: [transaction.start(), maskView, setUser, updateListItemRelations],
      patch: [transaction.start(), maskView, setUser, updateListItemRelations],
      remove: [transaction.start(), maskView],
    },
    after: {
      all: [ unMaskView ],
      create: [refreshView, transaction.end()],
      patch: [refreshView, transaction.end()],
      remove: [refreshView, transaction.end()],
    },
    error: {
      all: [ unMaskView ],
      create: [transaction.rollback()],
      patch: [transaction.rollback()],
      remove: [transaction.rollback()],
    },
  });
};
