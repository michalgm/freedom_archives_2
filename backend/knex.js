const knex = require("knex");

module.exports = function (app) {
  const { client, connection, searchPath } = app.get("postgres");
  const db = knex({
    client,
    connection,
    searchPath,
    // debug: true,
  });

  app.set("knexClient", db);
};
