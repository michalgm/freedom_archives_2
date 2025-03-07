// Initializes the `records` service on path `/records`
const { Service } = require("feathers-knex");

class UnifiedRecords extends Service {
  constructor(options) {
    super({
      ...options,
      name: "unified_records",
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
  };

  // Initialize our service with any options it requires
  app.use("/unified_records", new UnifiedRecords(options, app));
};
