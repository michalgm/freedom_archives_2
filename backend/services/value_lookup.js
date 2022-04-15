const {Service} = require('feathers-knex');

class ValueLookup extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'value_lookup'
    });
  }
}

module.exports = function(app) {
  const options = {
    id: 'value',
    Model: app.get('knexClient'),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/value_lookup', new ValueLookup(options, app));

};
