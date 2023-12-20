const { Service } = require("feathers-knex");

const {
  setUser,
  updateListItemRelations,
  refreshView,
  fetchUnified,
  prepListItemRelations,
  // setArchive,
} = require("./common_hooks/");

class Collections extends Service {
  constructor(options) {
    super({
      ...options,
      name: "collections",
      filters: {
        $fullText: (v) => v,
      },
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "collection_id",
    Model: app.get("knexClient"),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/collections", new Collections(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("collections");

  const updateRelations = async (context) => {
    const {
      app,
      params: {
        user,
        transaction: { trx },
      },
      data,
      relation_data = {},
    } = context;
    const id = context.id || context.result.collection_id;

    if (!Object.keys(data).length) {
      context.result = await trx("collections")
        .where("collections_id", id)
        .select();
    }

    if (relation_data.child_records !== undefined) {
      await Promise.all(
        relation_data.child_records.map((child) => {
          if (child.delete) {
            return app
              .service("records")
              .patch(
                child.record_id,
                { parent_record_id: null },
                { user, transaction: { trx } }
              );
          } else if (child.record_id && !child.parent_record_id) {
            return app
              .service("records")
              .patch(
                child.record_id,
                { parent_record_id: id },
                { user, transaction: { trx } }
              );
          }
        })
      );
      // delete data.children;
    }

    return context;
  };

  const updateChildren = async (context) => {
    const { id, params, app } = context;
    const { user, transaction } = params;
    const children = await app.service("records").find({
      query: { $select: ["record_id"], collection_id: id },
      paginate: false,
    });

    await Promise.all(
      children.map(({ record_id }) => {
        return app
          .service("records")
          .patch(record_id, { collection_id: 1000 }, { user, transaction });
      })
    );

    return context;
  };

  const prepData = (context) => {
    const { data } = context;
    if (data && Object.keys(data).length) {
      const relation_data = {};

      // remove calculated fields
      Object.keys(data).forEach((key) => {
        if (["children"].includes(key) || key.match("_search")) {
          delete data[key];
        }
      });

      ["child_records"].forEach((key) => {
        if (data[key]) {
          relation_data[key] = data[key];
          delete data[key];
        }
      });

      if ("publisher" in data) {
        data[`publisher_id`] = data["publisher"]
          ? data["publisher"].list_item_id
          : null;
        delete data["publisher"];
      }
      // if ('collection' in data) {
      //   data.collection_id = data.collection ? data.collection.collection_id : null;
      //   delete data.collection;
      // }
      if ("parent" in data) {
        data.parent_collection_id = data.parent
          ? data.parent.collection_id
          : null;
        delete data.parent;
      }

      context.relation_data = relation_data;
    }
    prepListItemRelations(context);

    return context;
  };

  service.hooks({
    before: {
      all: [prepData],
      get: [fetchUnified],
      find: [fetchUnified],
      create: [setUser],
      patch: [setUser, updateListItemRelations, updateRelations],
      remove: [setUser, updateChildren],
    },
    after: {
      all: [],
      create: [updateListItemRelations, updateRelations, refreshView],
      update: [refreshView],
      patch: [refreshView],
      remove: [refreshView],
    },
    error: {
      all: [],
      create: [],
      patch: [],
      remove: [],
    },
  });
};
