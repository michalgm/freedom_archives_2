const { Service } = require("feathers-knex");
const {
  hooks: { transaction },
} = require("feathers-knex");
class Instances extends Service {
  constructor(options) {
    super({
      ...options,
      name: "instances",
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "instance_id",
    Model: app.get("knexClient"),
    paginate: app.get("paginate"),
    multi: true,
  };

  // Initialize our service with any options it requires
  app.use("/instances", new Instances(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("instances");

  const updateView = async (context) => {
    const {
      id,
      app,
      data,
      params: {
        user,
        transaction: { trx },
      },
    } = context;
    if (!id) {
      await app.service("records").patch(data.record_id, {}, { user, transaction: { trx } });
    }
  };

  const cleanupMeta = (context) => {
    const { data } = context;
    ["format", "quality", "generation"].forEach((key) => {
      if (data[`${key}_item`] !== undefined) {
        data[key] = data[`${key}_item`].list_item_id;
        delete data[`${key}_item`];
      }
    });

    ["contributor_name", "contributor_username", "creator_name", "creator_username", "is_primary", "delete"].forEach(
      (key) => delete data[key]
    );
    return context;
  };

  service.hooks({
    before: {
      all: [],
      create: [transaction.start(), cleanupMeta],
      patch: [transaction.start(), cleanupMeta],
    },
    after: {
      create: [updateView, transaction.end()],
      patch: [updateView, transaction.end()],
      remove: [updateView, transaction.end()],
    },
    error: {
      patch: [transaction.rollback()],
    },
  });
};
