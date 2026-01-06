import { KnexService, transaction } from "@feathersjs/knex";

import { rankedSearch } from "./common_hooks/rankedSearch.js";

class DuplicateRecords extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "duplicate_records",
    });
  }
}

export default (function (app) {
  const options = {
    id: "duplicate_record_id",
    Model: app.get("postgresqlClient"),
    paginate: { ...app.get("paginate"), max: false },
    multi: true,
    operators: ["$fullText", "$contains"],
  };
  // Initialize our service with any options it requires
  app.use("/api/duplicate_records", new DuplicateRecords(options));
  // Get our initialized service so that we can register hooks
  const service = app.service("api/duplicate_records");

  service.hooks({
    before: {
      all: [transaction.start()],
      find: [rankedSearch],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: [],
    },
    after: {
      all: [transaction.end()],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: [],
    },
    error: {
      all: [transaction.rollback()],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: [],
    },
  });
});