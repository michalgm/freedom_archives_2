// Initializes the `users` service on path `/users`
const { Service } = require('feathers-knex');
const hooks = require('./users.hooks');

class Users extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'users'
    });
  }
}

module.exports = function(app) {
  const options = {
    id: 'user_id',
    Model: app.get('knexClient'),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/users', new Users(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('users');

  service.hooks(hooks);
};
