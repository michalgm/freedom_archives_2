import { BadRequest } from "@feathersjs/errors";
import { ERROR, KnexService } from "@feathersjs/knex";

import { rankedSearch, resetCallNumberRegex } from "./common_hooks/rankedSearch.js";

const fk_map = {
  generation: ["media"],
  quality: ["media"],
  format: ["media"],
  call_number: ["media", "collections"],
  program: ["records"],
  author: ["records_to_list_items"],
  producer: ["records_to_list_items"],
  subject: ["records_to_list_items", "collections_to_list_items"],
  keyword: ["records_to_list_items", "collections_to_list_items"],
  publishers: ["records_to_list_items", "collections_to_list_items"],
};

const handleExistingItem = async (context) => {
  const {
    error,
    data: { item },
  } = context;
  const pgError = error[ERROR] ?? error;
  if (pgError?.code === "23505" && pgError?.constraint === "list_items_type_idx") {
    throw new BadRequest(`An entry for '${item}' already exists for this list type. Did you mean to merge it instead?`);
  }

  return context;
};

const clearCallNumberCache = (context) => {
  if (context.data?.type === "call_number" || context.params?.list_item_type === "call_number") {
    resetCallNumberRegex();
  }
  return context;
};

const findRelations = async (context) => {
  const { id, service } = context;
  if (context.result) {
    return context;
  }
  const db = context?.params?.transaction?.trx ?? context.app.get("postgresqlClient");
  const item = await service._get(id);
  const type = item.type;
  context.params.list_item_type = type;
  const tables = (fk_map[type] || []).map((table) => [
    table,
    table.match("_to_list_items") ? "list_item_id" : `${type}_id`,
  ]);
  context.params.related_items = await Promise.all(
    tables.map(async ([table, field]) => {
      const baseTable = table.replace("_to_list_items", "");
      const idField = `${baseTable.replace(/s$/, "")}_id`;
      const ids = (await db(table).where(field, id).select([idField])).map((res) => res[idField]);
      return [baseTable, ids];
    }),
  );
  return context;
};

const findRecordType = async (context) => {
  const { data, method } = context;
  const { record_type } = data || {};
  if (method === "create") {
    if (data.type === "format" && !record_type) {
      throw new BadRequest("Missing record type for format item");
    } else if (data.type !== "format" && record_type) {
      throw new BadRequest("Only format items can have a record type");
    } else if (!data.type) {
      throw new BadRequest("Missing type for list item");
    }
  }
  if (record_type) {
    context.params.record_type = record_type;
    delete context.data.record_type;
    if (context.id) {
      const baseData = await context.service._get(context.id);
      if (baseData.type !== "format") {
        throw new BadRequest("Only format items can have a record type");
      }
      if (Object.keys(data).length === 0) {
        context.result = baseData;
      }
    }
  }

  return context;
};

const updateRecordType = async (context) => {
  const db = context?.params?.transaction?.trx ?? context.app.get("postgresqlClient");
  const record_type = context.params.record_type;

  if (record_type) {
    const { list_item_id } = context.result;
    await db("format_record_types")
      .insert({ list_item_id, record_type })
      .onConflict("list_item_id")
      .merge(["record_type"]);
  }
  delete context.params.record_type;
  return context;
};

const updateRelations = async (context) => {
  const {
    app,
    params: { related_items = [], user: _user, transaction },
  } = context;
  await Promise.all(
    related_items.map(([table, ids]) => {
      if (!ids.length) return;
      return Promise.all(
        ids.map((id) => {
          const data = { date_modified: new Date() };
          return app.service(`api/${table}`).patch(id, data, { transaction });
        }),
      );
    }),
  );

  delete context.params.related_items;
  return context;
};

const fetchListItemsLookupResult = async (context) => {
  const { method } = context;
  const select = context.params.query?.$select ?? "*";
  const db = context?.params?.transaction?.trx ?? context.app.get("postgresqlClient");
  if (method === "find") {
    const { isPaginated, data } =
      context.result?.data !== undefined
        ? { isPaginated: true, data: context.result.data }
        : { isPaginated: false, data: context.result };

    const ids = (Array.isArray(data) ? data : [data]).map((r) => r.list_item_id);
    const rows = await db("list_items_lookup").whereIn("list_item_id", ids).select(select);

    if (isPaginated) {
      context.result.data = rows;
    } else {
      context.result = rows;
    }
  } else {
    // get, create, patch, update — single record
    context.result = await db("list_items_lookup")
      .where({ list_item_id: context.result.list_item_id })
      .select(select)
      .first();
    if (context?.result?.type !== "format") {
      delete context.result.record_type;
    }
  }

  return context;
};

const merge = async (context) => {
  const {
    id,
    params: { transaction, list_item_type },
    data,
    service,
  } = context;

  const { merge_target_id } = data;
  if (!merge_target_id) {
    throw new BadRequest("Missing merge target id");
  }
  if (!list_item_type) {
    throw new BadRequest("Missing list_item_type in params");
  }

  const item = await service._get(merge_target_id, { transaction });

  if (item.type !== list_item_type) {
    throw new BadRequest("Cannot merge items of different types");
  }

  const tables = (fk_map[list_item_type] || []).map((table) => [
    table,
    table.match("_to_list_items") ? "list_item_id" : `${list_item_type}_id`,
  ]);

  await Promise.all(
    tables.map(async ([table, field]) => {
      // Remove lookup table entries where both source and target are present to avoid conflicts.
      if (table.endsWith("_to_list_items")) {
        const object_type = table.replace("s_to_list_items", "");
        await transaction
          .trx(`${table} as a`)
          .where("a.list_item_id", id)
          .whereIn(`a.${object_type}_id`, function () {
            this.select(`b.${object_type}_id`).from(`${table} as b`).where("b.list_item_id", merge_target_id);
          })
          .delete();
      }

      await transaction
        .trx(table)
        .where(field, id)
        .update({
          [field]: merge_target_id,
        });
    }),
  );
  await transaction.trx("list_items").where("list_item_id", id).delete();
  context.result = await service._get(merge_target_id, { transaction });
  return context;
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

  service.hooks({
    before: {
      create: [findRecordType],
      patch: [findRecordType, findRelations],
      update: [findRecordType, findRelations, merge],
      remove: [findRelations],
      find: [rankedSearch],
    },
    after: {
      create: [updateRecordType, updateRelations, clearCallNumberCache, fetchListItemsLookupResult],
      patch: [updateRecordType, updateRelations, clearCallNumberCache, fetchListItemsLookupResult],
      update: [updateRecordType, updateRelations, clearCallNumberCache, fetchListItemsLookupResult],
      remove: [updateRelations, clearCallNumberCache],
    },
    error: {
      create: [handleExistingItem],
      patch: [handleExistingItem],
      update: [],
      remove: [],
    },
  });
});
