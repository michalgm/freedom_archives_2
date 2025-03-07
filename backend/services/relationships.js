const { Service } = require("feathers-knex");
const {
  hooks: { transaction },
} = require("feathers-knex");

class Relationships extends Service {
  constructor(options) {
    super({
      ...options,
      name: "unknown_relations",
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "id",
    Model: app.get("postgresqlClient"),
    paginate: { ...app.get("paginate"), max: false },
  };

  // Initialize our service with any options it requires
  app.use("/relationships", new Relationships(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("relationships");

  const updateRelations = async (context) => {
    const {
      data: { type },
      app,
      result,
      params: { user },
    } = context;
    if (type === "unknown") {
    } else if (type === "parent") {
      await app.service("records").patch(result.docid_2, { parent_record_id: result.docid_1 }, { user });
      await app.service("records").patch(result.docid_1, {}, { user });
    } else if (type === "child") {
      await app.service("records").patch(result.docid_1, { parent_record_id: result.docid_2 }, { user });
      await app.service("records").patch(result.docid_2, {}, { user });
    } else if (type === "sibling") {
      const record1 = await app.service("records").get(result.docid_1);
      let parent_id = record1.parent_record_id;
      if (!parent_id) {
        const record2 = await app.service("records").get(result.docid_2);
        parent_id = record2.parent_record_id;
      }
      if (parent_id) {
        await app.service("records").patch(result.docid_1, { parent_record_id: parent_id }, { user });
        await app.service("records").patch(result.docid_2, { parent_record_id: parent_id }, { user });
      }
    } else if (type === "original") {
      await app
        .service("instances")
        .patch(null, { record_id: result.docid_1 }, { user, query: { record_id: result.docid_2 } });
    } else if (type === "instance") {
      await app
        .service("instances")
        .patch(null, { record_id: result.docid_2 }, { user, query: { record_id: result.docid_1 } });
    }
    // console.log('####', type, result);
    return context;
  };

  const setUser = (context) => {
    const {
      data,
      service: { Model },
      params: {
        user: { username },
      },
    } = context;
    data.user = username;
    data.updated_at = Model.raw("now()");
    return context;
  };

  service.hooks({
    before: {
      all: [],
      patch: [transaction.start(), setUser],
    },
    after: {
      patch: [updateRelations, transaction.end()],
    },
    error: {
      patch: [transaction.rollback()],
    },
  });
};
