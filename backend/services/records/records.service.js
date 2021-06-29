// Initializes the `records` service on path `/records`
const { Service } = require('feathers-knex');
const hooks = require('./records.hooks');

class Records extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'records',
      whitelist: ['$fullText', '$overlap']
    });
  }
}

module.exports = function(app) {
  const options = {
    id: 'record_id',
    Model: app.get('knexClient'),
    paginate: app.get('paginate'),
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/records', new Records(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('records');

  service.hooks(hooks);
};
