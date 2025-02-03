const { Service } = require("feathers-knex");
const {
  hooks: { transaction },
} = require("feathers-knex");

const { refreshView } = require("./common_hooks/");
class ListItems extends Service {
  constructor(options) {
    super({
      ...options,
      name: "list_items",
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "list_item_id",
    Model: app.get("knexClient"),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/list_items", new ListItems(options, app));

  const service = app.service("list_items");

  const updateRecords = async (context) => {
    const {
      id,
      params: {
        transaction: { trx },
      },
    } = context;

    return Promise.all(
      ["record", "collection"].map(async (table) => {
        const ids = await trx(`${table}s_to_list_items`)
          .where("list_item_id", id)
          .select([`${table}_id`]);

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
      patch: [transaction.start()],
    },
    after: {
      patch: [updateRecords, transaction.end()],
    },
    error: {
      patch: [transaction.rollback()],
    },
  });
};
