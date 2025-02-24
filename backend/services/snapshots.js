const { KnexService, transaction } = require("@feathersjs/knex");
const { setArchive } = require("./common_hooks");

const LIVE_SNAPSHOT_TITLE = "Public Data";

class Snapshots extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "snapshots",
    });
  }
}

module.exports = function (app) {
  const options = {
    id: "snapshot_id",
    Model: app.get("knexClient"),
  };

  app.use("/snapshots", new Snapshots(options, app), { methods: ["create", "find", "patch"] });

  const service = app.service("snapshots");

  service.hooks({
    before: {
      all: [],
      create: [
        transaction.start(),
        setArchive,
        (context) => {
          context.data.title = LIVE_SNAPSHOT_TITLE;
          return context;
        },
      ],

      find: [
        (context) => {
          context.params.query.$sort ||= { is_live: -1, date_published: -1 };
        },
      ],
      patch: [transaction.start(), restoreSnapshot],
    },
    after: {
      create: [publishSite, transaction.end()],
      patch: [transaction.end()],
    },
    error: {
      create: [transaction.rollback()],
      patch: [transaction.rollback()],
    },
  });
};

const public_tables = {
  records: {
    deleteQuery: `delete from public_search.records_snapshot where record_id
    not in (select record_id from records r join collections c using(collection_id) where r.is_hidden = false and c.is_hidden = false and r.needs_review = true)`,
    selectTarget: "records_snapshot_view",
  },
  collections: {
    deleteQuery: `delete from public_search.collections_snapshot where collection_id
    not in (select collection_id from collections c where c.is_hidden = false and c.needs_review = true)`,
    selectTarget: "collections_snapshot_view",
  },
  list_items: { selectTarget: "list_items_snapshot_view" },
  records_to_list_items: { selectTarget: "records_to_list_items_snapshot_view" },
  featured_records: {},
  config: {},
};

const restoreSnapshot = async (context) => {
  const {
    params: {
      transaction: { trx },
    },
    id,
  } = context;
  const { archive_id, snapshot_id, title, ...data } = await trx("snapshots").where({ snapshot_id: id }).first();
  delete data.is_live;

  for (const table of Object.keys(public_tables)) {
    const columns = await trx(`${table}_snapshots`)
      .columnInfo()
      .then((info) => Object.keys(info).filter((col) => col !== "snapshot_id"));
    await trx(`public_search.${table}`).where({ archive_id }).delete();
    await trx(`public_search.${table}`).insert(
      trx(`${table}_snapshots`).select(columns).where({ snapshot_id }).select()
    );
  }
  await trx("snapshots").where({ title: LIVE_SNAPSHOT_TITLE, archive_id }).update(data);
  context.result = { snapshot_id, title, ...data };
};

const publishSite = async (context) => {
  const {
    params: {
      transaction: { trx },
    },
    result: { snapshot_id },
    data,
  } = context;
  const { archive_id } = data;
  for (const table of Object.keys(public_tables)) {
    console.time(`copy ${table}`);
    const target = `${table}_snapshots`;
    await trx(target).insert(trx(`public_search.${table}`).select([snapshot_id, "*"]).where({ archive_id }));
    console.timeEnd(`copy ${table}`);
  }
  for (const [table, { selectTarget }] of Object.entries(public_tables)) {
    console.time(`delete ${table}`);

    const deleteQuery = trx(`public_search.${table}`).where({ archive_id });

    if (table == "records") {
      deleteQuery.whereNotIn(
        "record_id",
        trx("records")
          .join("collections", { "records.collection_id": "collections.collection_id" })
          .where({ "records.is_hidden": false, "collections.is_hidden": false, "records.needs_review": true })
          .select("record_id")
      );
    } else if (table === "collections") {
      deleteQuery.whereNotIn(
        "collection_id",
        trx("collections").where({ is_hidden: false, needs_review: true }).select("collection_id")
      );
    } else if (table === "records_to_list_items") {
      deleteQuery.whereNotIn(
        "record_id",
        trx("records")
          .join("collections", { "records.collection_id": "collections.collection_id" })
          .where({ "records.is_hidden": false, "collections.is_hidden": false, "records.needs_review": true })
          .select("record_id")
      );
    }
    await deleteQuery.delete();
    console.timeEnd(`delete ${table}`);
    console.time(`update ${table}`);

    await trx(`public_search.${table}`).insert(
      trx(selectTarget || table)
        .where({ archive_id })
        .select()
    );
    console.timeEnd(`update ${table}`);
  }

  await trx("snapshots").where({ title: "Snapshot 3", archive_id }).delete();
  await trx("snapshots").where({ archive_id, title: "Snapshot 2" }).update({ title: "Snapshot 3" });
  await trx("snapshots").where({ archive_id, title: "Snapshot 1" }).update({ title: "Snapshot 2" });
  await trx("snapshots")
    .whereNot({ snapshot_id })
    .andWhere({ archive_id, title: LIVE_SNAPSHOT_TITLE })
    .update({ title: "Snapshot 1" });

  const metadata = {};
  for (const type of ["record", "collection"]) {
    const { count, date } = await trx(`public_search.${type}s`)
      .count(`${type}_id`)
      .max("date_modified as date")
      .first();
    metadata[`${type}s_count`] = parseInt(count, 10);
    metadata[`max_${type}_date`] = date;
  }
  await trx("snapshots").where({ snapshot_id }).update(metadata);
  return context;
};
