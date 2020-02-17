const { Service } = require('feathers-knex');
const { authenticate } = require('@feathersjs/authentication').hooks;

class Relationships extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'unknown_relations'
    });
  }
}

module.exports = function(app) {
  const options = {
    id: 'id',
    Model: app.get('knexClient'),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/relationships', new Relationships(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('relationships');

  service.hooks({
    before: {
      all: [authenticate('jwt')],
    }
  });
};
