// Initializes the `records` service on path `/records`
const { KnexService } = require("@feathersjs/knex");
const hooks = require("./records.hooks");

class Records extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "records",
      filters: {
        $fullText: (v) => v,
      },
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "record_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
    multi: true,
  };

  // Initialize our service with any options it requires
  app.use("/api/records", new Records(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("api/records");

  service.hooks(hooks);
};
