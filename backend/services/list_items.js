const { Service } = require('feathers-knex');
const { authenticate } = require('@feathersjs/authentication').hooks;

class ListItems extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'list_items'
    });
  }
}

module.exports = function(app) {
  const options = {
    id: 'list_item_id',
    Model: app.get('knexClient'),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/list_items', new ListItems(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('list_items');

  service.hooks({
    before: {
      all: [authenticate('jwt')],
    }
  });
};
