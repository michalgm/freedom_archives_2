const { KnexService } = require("@feathersjs/knex");

const {
  setUser,
  updateListItemRelations,
  refreshView,
  fetchUnified,
  prepListItemRelations,
  // setArchive,
} = require("./common_hooks/");

class Collections extends KnexService {
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
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/api/collections", new Collections(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("api/collections");

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
      context.result = await trx("collections").where("collections_id", id).select();
    }

    if (relation_data.children !== undefined) {
      let index = 0;
      await Promise.all(
        relation_data.children.map((child) => {
          if (child.delete) {
            return app
              .service("collections")
              .patch(child.collection_id, { parent_collection_id: null }, { user, transaction: { trx } });
          } else if (child.collection_id) {
            return app
              .service("collections")
              .patch(
                child.collection_id,
                { parent_collection_id: id, display_order: index++ },
                { user, transaction: { trx } }
              );
          }
        })
      );
    }

    if (relation_data.child_records !== undefined) {
      await Promise.all(
        relation_data.child_records.map((child) => {
          if (child.delete) {
            return app
              .service("records")
              .patch(child.record_id, { collection_id: 1000 }, { user, transaction: { trx } });
          } else if (child.record_id) {
            return app
              .service("api/records")
              .patch(child.record_id, { collection_id: id }, { user, transaction: { trx } });
          }
        })
      );
    }

    if (relation_data.featured_records !== undefined) {
      const { deleteIds, updateRecords } = relation_data.featured_records.reduce(
        (acc, record) => {
          if (record.delete) {
            acc.deleteIds.push(record.record_id);
          } else {
            acc.updateRecords.push({
              record_id: record.record_id,
              collection_id: id,
              record_order: acc.updateRecords.length + 1,
              label: record.label,
            });
          }
          return acc;
        },
        { deleteIds: [], updateRecords: [] }
      );

      await trx.from("featured_records").where("collection_id", id).whereIn("record_id", deleteIds).delete();

      await trx.from("featured_records").insert(updateRecords).onConflict(["collection_id", "record_id"]).merge();
    }

    return context;
  };

  const updateChildren = async (context) => {
    const { id, params, app } = context;
    const { user, transaction } = params;
    const children = await app.service("api/records").find({
      query: { $select: ["record_id"], collection_id: id },
      paginate: false,
    });

    await Promise.all(
      children.map(({ record_id }) => {
        return app.service("api/records").patch(record_id, { collection_id: 1000 }, { user, transaction });
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
        if (["add_new_record"].includes(key) || key.match("_search")) {
          delete data[key];
        }
      });

      ["child_records", "children", "featured_records"].forEach((key) => {
        if (data[key]) {
          relation_data[key] = data[key];
          delete data[key];
        }
      });

      if ("publisher" in data) {
        data[`publisher_id`] = data["publisher"] ? data["publisher"].list_item_id : null;
        delete data["publisher"];
      }
      // if ('collection' in data) {
      //   data.collection_id = data.collection ? data.collection.collection_id : null;
      //   delete data.collection;
      // }
      if ("parent" in data) {
        data.parent_collection_id = data.parent ? data.parent.collection_id : null;
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
