const { Service } = require("feathers-knex");

class ReviewChanges extends Service {
  constructor(options) {
    super({
      ...options,
      name: "review_changes",
    });
    // this.find = this.find.bind(this);
  }
}

module.exports = function (app) {
  const options = {
    id: "id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/review_changes", new ReviewChanges(options, app));
};
