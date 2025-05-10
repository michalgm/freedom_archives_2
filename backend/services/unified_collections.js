import { KnexService } from "@feathersjs/knex";

import { rankedSearch } from "./common_hooks/index.js";

class UnifiedCollections extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "unified_collections",
      operators: ["$fullText"],
      extendedOperators: {
        $overlap: "&&",
        $contains: "@>",
        $contained_by: "<@",
        $fulltext: "@@",
      },
    });
  }
}
export default (function (app) {
  const options = {
    id: "collection_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("api/unified_collections", new UnifiedCollections(options));

  const service = app.service("api/unified_collections");
  service.hooks({
    before: {
      all: [],
      find: [rankedSearch],
    },
  });
});
