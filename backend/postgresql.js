const knex = require("knex");

module.exports = function (app) {
  const config = app.get("postgresql");
  const db = knex({
    ...config,
    // debug: true,
  });

  app.set("postgresqlClient", db);
};
