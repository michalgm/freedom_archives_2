const { Service } = require("feathers-knex");

class ValueLookup extends Service {
  constructor(options) {
    super({
      ...options,
      name: "list_items_lookup",
    });
    // this.find = this.find.bind(this);
  }
}

module.exports = function (app) {
  const options = {
    id: "list_item_id",
    Model: app.get("knexClient"),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/list_items_lookup", new ValueLookup(options, app));
};
