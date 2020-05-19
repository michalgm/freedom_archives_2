const { Service } = require('feathers-knex');
const { authenticate } = require('@feathersjs/authentication').hooks;
const { hooks: { transaction } } = require('feathers-knex');

class Instances extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'instances'
    });
  }
}

module.exports = function(app) {
  const options = {
    id: 'instance_id',
    Model: app.get('knexClient'),
    paginate: app.get('paginate'),
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/instances', new Instances(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('instances');

  const updateView = async (context) => {
    const { app, data } = context;
    await app.service('records').patch(data.record_id, {});
  };

  service.hooks({
    before: {
      all: [authenticate('jwt')],
      patch: [transaction.start()]
    },
    after: {
      create: [updateView, transaction.end()],
      patch: [updateView, transaction.end()],
      remove: [updateView, transaction.end()],
    },
    error: {
      patch: [transaction.rollback()],
    }
  });
};
