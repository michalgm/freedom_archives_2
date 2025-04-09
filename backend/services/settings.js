import { feathers } from "@feathersjs/feathers";
import { KnexService } from "@feathersjs/knex";
import schema from "@feathersjs/schema";
import lodash from "lodash";
import { setArchive, setArchiveData } from "./common_hooks/index.js";
const { keyBy } = lodash;
const { hooks: schemaHooks, resolve, virtual } = schema;
const settingsResultResolver = resolve({
  featured_collection: virtual(async ({ settings }, context) => {
    if (settings.featured_collection_id) {
      return await context.app
        .service("api/collections")
        .get(settings.featured_collection_id, { query: { $select: ["collection_name", "thumbnail", "parent"] } });
    }
    return {};
  }),
});
class Settings extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "settings",
    });
  }
}
export default (function (app) {
  const options = {
    id: "archive_id",
    Model: app.get("postgresqlClient"),
  };
  // Initialize our service with any options it requires
  app.use("/api/settings", new Settings(options, app), { methods: ["get", "update", "patch"] });
  const service = app.service("api/settings");
  const verifyArchive = (context) => {
    const {
      id,
      params: {
        user: { archive_id },
      },
    } = context;
    if (archive_id !== parseInt(id, 10)) {
      throw new Error("You are not authorized to access this archive");
    }
  };
  service.hooks({
    around: {
      all: [schemaHooks.resolveResult(settingsResultResolver), setArchiveData],
    },
    before: {
      all: [],
      get: [verifyArchive],
      update: [verifyArchive],
      patch: [verifyArchive],
    },
    after: {},
  });
});
