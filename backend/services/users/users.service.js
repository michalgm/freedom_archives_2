// Initializes the `users` service on path `/users`
const { KnexService } = require("@feathersjs/knex");
const hooks = require("./users.hooks");

class Users extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "users",
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "user_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/api/users", new Users(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("api/users");

  service.hooks(hooks);
};
