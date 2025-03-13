const { KnexService } = require("@feathersjs/knex");

class ValueLookup extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "value_lookup",
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "value",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/api/value_lookup", new ValueLookup(options, app));
};
