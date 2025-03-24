const knex = require("knex");

module.exports = function (app) {
  const config = app.get("postgresql");
  const db = knex({
    ...config,
    extendedOperators: {
      $overlap: "&&",
      $contains: "@>",
      $contained_by: "<@",
      $fulltext: "@@",
    },
    // debug: true,
  });

  app.set("postgresqlClient", db);
};
