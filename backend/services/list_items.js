import { BadRequest } from "@feathersjs/errors";
import { KnexService, transaction } from "@feathersjs/knex";

import { rankedSearch } from "./common_hooks/index.js";

const fk_map = {
  generation: ['instances'],
  quality: ['instances'],
  format: ['instances'],
  call_number: ['instances', 'collections'],
  program: ['records'],
  publisher: ['records', 'collections'],
  author: ['records_to_list_items'],
  producer: ['records_to_list_items'],
  subject: ['records_to_list_items', 'collections_to_list_items'],
  keyword: ['records_to_list_items', 'collections_to_list_items'],
};

class ListItems extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "list_items",
    });
  }
}
export default (function (app) {
  const options = {
    id: "list_item_id",
    Model: app.get("postgresqlClient"),
    paginate: { ...app.get("paginate"), max: false },
  };
  // Initialize our service with any options it requires
  app.use("/api/list_items", new ListItems(options));

  const service = app.service("api/list_items");

  const merge = async (context) => {
    const { id, params: { transaction, list_item_type }, data } = context;

    const { merge_target_id } = data;
    if (!merge_target_id) {
      throw new BadRequest("Missing merge target id");
    }

    const item = await service._get(merge_target_id, { transaction });

    console.log('@@@', item, merge_target_id, id, list_item_type, item.type);
    if (item.type !== list_item_type) {
      console.log('@@@', list_item_type, context.params.list_item_type);
      throw new BadRequest("Cannot merge items of different types");
    }

    const tables = (fk_map[list_item_type] || []).map(table => [table, table.match('_to_list_items') ? 'list_item_id' : `${list_item_type}_id`]);

    await Promise.all(
      tables.map(async ([table, field]) => {
        return transaction.trx(table)
          .where(field, id)
          .update({
            [field]: merge_target_id,
          });
      })
    );
    await transaction.trx("list_items").where("list_item_id", id).delete();
    context.result = await service._get(merge_target_id, { transaction });
    return context;
  };

  const findRelations = async (context) => {
    const {
      id,
      params: {
        transaction: { trx },
      },
      service
    } = context;
    const item = await service._get(id);
    const type = item.type;
    context.params.list_item_type = type;
    const tables = (fk_map[type] || []).map(table => [table, table.match('_to_list_items') ? 'list_item_id' : `${type}_id`]);
    context.params.related_items = await Promise.all(
      tables.map(async ([table, field]) => {
        const baseTable = table.replace('_to_list_items', '');
        const idField = `${baseTable.replace(/s$/, '')}_id`;
        const ids = (await trx(table)
          .where(field, id)
          .select([idField])).map((res) => res[idField]);
        return [baseTable, ids];
      })
    );
    return context;
  };

  const updateRelations = async (context) => {
    const {
      app,
      params: {
        related_items = [],
        user: _user,
        transaction,
      },
    } = context;

    delete context.params.related_items;

    await Promise.all(
      related_items.map(([table, ids]) => {
        if (!ids.length) return;
        return Promise.all(
          ids.map((id) => {
            const data = { date_modified: new Date() };
            return app.service(`api/${table}`).patch(id, data, { transaction });
          })
        );
      })
    );
    return context;
  };

  service.hooks({
    before: {
      all: [],
      patch: [transaction.start(), findRelations],
      update: [transaction.start(), findRelations, merge],
      remove: [transaction.start(), findRelations],
      find: [rankedSearch],
    },
    after: {
      patch: [updateRelations, transaction.end()],
      update: [updateRelations, transaction.end()],
      remove: [updateRelations, transaction.end()],
    },
    error: {
      patch: [transaction.rollback()],
      update: [transaction.rollback()],
      remove: [transaction.rollback()],
    },
  });
});
