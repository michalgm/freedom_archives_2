import { KnexService } from "@feathersjs/knex";
class UnifiedRecords extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "unified_records",
      operators: ["$fullText", "$contains"],
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
    id: "record_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("/api/unified_records", new UnifiedRecords(options, app));
});
