const { Service } = require('feathers-knex');
const { authenticate } = require('@feathersjs/authentication').hooks;
const {
  hooks: { transaction },
} = require('feathers-knex');

class Collections extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'collections',
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
      patch: [transaction.start()],
    },
    after: {
      patch: [transaction.end()],
    },
    error: {
      patch: [transaction.rollback()],
    },
  });
};
