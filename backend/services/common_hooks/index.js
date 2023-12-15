const { writeThumbnail, writeThumbnailFromUrl } = require('./thumbnailer');

module.exports = {
  writeThumbnail,
  writeThumbnailFromUrl,
  setUser: (context) => {
    const {
      data,
      method,
      service: { Model },
      params: {
        user: { user_id },
      },
    } = context;
    if (method === "create") {
      data.creator_user_id = user_id;
      data.date_created = Model.raw("now()");
    } else {
      data.contributor_user_id = user_id;
      data.date_modified = Model.raw("now()");
    }
    return context;
  },

  fetchUnified: async (context) => {
    const { id, app, method, params, path } = context;
    // context.params.knex = context.app.service(`unified_${path}`).createQuery(context.params);
    if (method === "get") {
      context.result = await app.service(`unified_${path}`).get(id, params);
    } else {
      context.result = await app.service(`unified_${path}`).find(params);
    }
    return context;
  },
  prepListItemRelations: (context) => {
    const { data, relation_data = {} } = context;
    if (data && Object.keys(data).length) {
      ["subjects", "keywords", "producers", "authors"].forEach((key) => {
        if (data[key]) {
          relation_data[key] = data[key];
          delete data[key];
        }
      });
      if ("collection" in data) {
        data.collection_id = data.collection
          ? data.collection.collection_id
          : null;
        delete data.collection;
      }
    }
    return context;
  },

  updateListItemRelations: async (context) => {
    const {
      data,
      relation_data,
      path,
      params: {
        transaction: { trx },
      },
    } = context;
    const id = context.id || context.result.record_id;

    const table = path.slice(0, -1);
    for (const type of ["subjects", "keywords", "producers", "authors"]) {
      if (relation_data && relation_data[type] !== undefined) {
        // console.log('UPDATE', relation_data);

        const ids = trx
          .from(`${table}s_to_list_items`)
          .join(
            "list_items",
            `${table}s_to_list_items.list_item_id`,
            "list_items.list_item_id"
          )
          .where("type", type.replace(/s$/, ""))
          .andWhere(`${table}_id`, id)
          .select(`${table}s_to_list_items.list_item_id`);

        await trx(`${table}s_to_list_items`)
          .whereIn("list_item_id", ids)
          .delete();

        await trx(`${table}s_to_list_items`).insert(
          relation_data[type].map(({ list_item_id }) => ({
            list_item_id,
            [`${table}_id`]: id,
          }))
        );
        // console.log('UPDATE', context.data);
      }
    }

    if (!Object.keys(data).length) {
      context.result = await trx("records").where("record_id", id).select();
    }

    // console.log('UPDATE DONE', context.result);
    return context;
  },

  refreshView: async (context) => {
    const {
      result,
      method,
      path,
      params: {
        transaction: { trx },
      },
    } = context;

    const id = context.id || result.record_id;
    const table = path.slice(0, -1);
    if (["update", "patch", "remove", "create"].includes(method)) {
      await trx(`_unified_${table}s`).where(`${table}_id`, id).delete();
    }
    if (["update", "patch", "create"].includes(method)) {
      const [current_data = {}] = await trx(`${table}s_view`)
        .where(`${table}_id`, id)
        .select();
      const encoded = {};
      Object.keys(current_data).forEach((key) => {
        if (
          current_data[key] &&
          typeof current_data[key] === "object" &&
          !key.includes("_search") &&
          ![
            "call_numbers",
            "formats",
            "qualitys",
            "generations",
            "media_types",
            "siblings",
          ].includes(key)
        ) {
          encoded[key] = JSON.stringify(current_data[key]);
        } else {
          encoded[key] = current_data[key];
          // delete current_data[key]; //FIXME?
        }
      });
      context.result = current_data;
      await trx(`_unified_${table}s`).insert(encoded);
      return context;
    }
  },
};
