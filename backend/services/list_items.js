import { KnexService, transaction } from "@feathersjs/knex";

import { refreshView } from "./common_hooks/index.js";

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
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("/api/list_items", new ListItems(options));
  const service = app.service("api/list_items");
  const findRelations = async (context) => {
    const {
      id,
      params: {
        transaction: { trx },
      },
    } = context;
    context.params.related_items = await Promise.all(
      ["record", "collection", "instance"].map(async (table) => {
        const ids = await trx(`${table}s_to_list_items`)
          .where("list_item_id", id)
          .select([`${table}_id`]);
        return [table, ids];
      })
    );
    return context;
  };
  const updateRecords = async (context) => {
    const {
      params: {
        transaction: { trx },
        related_items = [],
      },
    } = context;
    return Promise.all(
      related_items.map(async ([table, ids]) => {
        return Promise.all(
          ids.map(async (res) => {
            const id = res[`${table}_id`];
            await refreshView({
              id,
              method: "patch",
              path: `${table}s`,
              params: {
                transaction: { trx },
              },
            });
          })
        );
      })
    );
  };
  service.hooks({
    before: {
      all: [],
      patch: [transaction.start(), findRelations],
      remove: [transaction.start(), findRelations],
    },
    after: {
      patch: [updateRecords, transaction.end()],
      remove: [updateRecords, transaction.end()],
    },
    error: {
      patch: [transaction.rollback()],
      remove: [transaction.rollback()],
    },
  });
});
