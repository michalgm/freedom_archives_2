// Initializes the `collections` service on path `/collections`
const { KnexService } = require("@feathersjs/knex");

class UnifiedCollections extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "unified_collections",
      operators: ["$fullText"],
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "collection_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/api/unified_collections", new UnifiedCollections(options, app));
};
