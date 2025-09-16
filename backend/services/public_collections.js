import { KnexService } from "@feathersjs/knex";

class PublicCollections extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "public_search.collections",
    });
  }
}
export default (function (app) {
  const options = {
    id: "collection_id",
    Model: app.get("postgresqlClient"),
  };
  // Initialize our service with any options it requires
  app.use("/api/public/collections", new PublicCollections(options), { methods: ["get", "find"] });
  const service = app.service("api/public/collections");

  service.hooks({
    around: {
      all: [],
    },
    before: {
      all: [],
      get: [],
    },
    after: {},
  });
});
