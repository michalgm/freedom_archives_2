const tsquery = require("pg-tsquery")();
const {
  hooks: { transaction },
} = require("feathers-knex");
const {
  setUser,
  updateListItemRelations,
  prepListItemRelations,
  refreshView,
  updateThumbnailFromUrl,
  fetchUnified,
  setArchive,
} = require("../common_hooks/");

const fullTextSearch = (context) => {
  if (context.params.query.$fullText !== undefined) {
    const { $fullText, ...query } = context.params.query;
    const knex = context.app
      .service(`unified_${context.path}`)
      .createQuery({ ...context.params, query });
    if ($fullText) {
      const fullTextQuery = tsquery($fullText);
      context.fullText = fullTextQuery;
      knex.select(
        context.service.Model.raw(
          `ts_rank_cd(fulltext, to_tsquery('english', ?)) AS score`,
          [fullTextQuery]
        )
      );
      knex.whereRaw(`fulltext @@ to_tsquery('english', ?)`, [fullTextQuery]);
      knex.orderBy("score", "desc");
    }
    context.params.knex = knex;
  }
};
const lookupFilters = async ({
  params: {
    knex,
    query: { $fullText },
    // transaction: { trx },
  },
  result,
  service: { Model },
}) => {
  // console.log('AFTER FIND');

  if ($fullText !== undefined) {
    const ids = await knex
      .clearSelect()
      .clearOrder()
      .select("record_id")
      .toString();

    // await trx.raw(
    //   `create temp table search_results3  on commit drop as ${ids}`
    // );
    // const subquery = `select record_id from search_results3`;
    // console.log(res);
    const subquery = ids;

    const filters = (
      await Promise.all(
        [
          `select
          type, array_agg(jsonb_build_array(item, count::text) order by count desc) as values
          from (
            select
              item, type, count(*) as count
            from records_to_list_items a
            join list_items b
            using (list_item_id)
            where record_id in (${subquery})
            group by item, type
            order by type
          ) a group by type`,
          `select 'year' as type, array_agg(jsonb_build_array(year, count::text) order by count desc, year) as values from (
          select year::text, count(*) as count
          from records
          where record_id in (${subquery})
          group by year
        ) a`,
          `select 'collection' as type, array_agg(jsonb_build_array(collection_name, count::text, collection_id) order by count desc, collection_name) as values from (
          select collection_id, max(collection_name) as collection_name, count(*) as count
          from records
          join collections using (collection_id)
          where record_id in (${subquery})
          group by collection_id
        ) a`,
          `select 'title' as type, array_agg(jsonb_build_array(title, count::text) order by count desc, title) as values from (
          select title, count(*) as count
          from records
          where record_id in (${subquery})
          group by title
        ) a`,
        ].flatMap(async (query) => (await Model.raw(query)).rows.flat())
      )
    ).flat();

    // await trx.raw(`drop table search_results3 `);

    // console.log(filters);
    result.filters = filters;
  }
};

const prepData = (context) => {
  const { data } = context;
  if (data && Object.keys(data).length) {
    const relation_data = {};

    // remove calculated fields
    Object.keys(data).forEach((key) => {
      if (
        [
          "call_numbers",
          "formats",
          "qualitys",
          "generations",
          "media_types",
          "siblings",
          "relationships",
          "primary_instance_id",
        ].includes(key) ||
        key.match("_search")
      ) {
        delete data[key];
      }
    });

    if (data.date_string) {
      let parts = ["month", "day", "year"];
      data.date_string.split("/").forEach((part, index) => {
        if (["00", "MM", "DD", "YYYY"].includes(part)) {
          data[parts[index]] = null;
        } else {
          data[parts[index]] = part;
        }
      });
      delete data.date_string;
    }
    // Stash relation data out of data object

    ["program", "publisher"].forEach((key) => {
      if (key in data) {
        data[`${key}_id`] = data[key] ? data[key].list_item_id : null;
      }
    });
    if ("collection" in data) {
      data.collection_id = data.collection
        ? data.collection.collection_id
        : null;
    }
    if ("parent" in data) {
      data.parent_record_id = data.parent ? data.parent.record_id : null;
    }

    [
      "instances",
      "children",
      "continuations",
      "program",
      "publisher",
      "collection",
      "parent",
    ].forEach((key) => {
      if (data[key]) {
        relation_data[key] = data[key];
        delete data[key];
      }
    });

    context.relation_data = relation_data;
  }
  prepListItemRelations(context);
  return context;
};

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
  const id = context.id || context.result.record_id;

  if (!Object.keys(data).length) {
    context.result = await trx("records").where("record_id", id).select();
  }

  if (relation_data.instances !== undefined) {
    await Promise.all(
      relation_data.instances.map((instance) => {
        if (instance.delete) {
          return app
            .service("instances")
            .remove(instance.instance_id, { user, transaction: { trx } });
        } else if (instance.instance_id) {
          return app
            .service("instances")
            .patch(instance.instance_id, instance, {
              user,
              transaction: { trx },
            });
        }
        delete instance.instance_id;
        instance.record_id ||= id;
        return app
          .service("instances")
          .create(instance, { user, transaction: { trx } });
      })
    );
  }

  if (relation_data.children !== undefined) {
    await Promise.all(
      relation_data.children.map((child) => {
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
  }

  if (relation_data.continuations !== undefined) {
    const { continuation_id } = relation_data.continuations[0] || {};

    const continuation_records = relation_data.continuations
      .filter((record) => !record.delete)
      .map((record) => record.record_id);

    if (continuation_id) {
      await trx("continuations")
        .where({ continuation_id })
        .update({ continuation_records });
    } else {
      await trx("continuations").insert({
        continuation_records: [id, ...continuation_records],
      });
    }

    // delete data.new_continuation; FIXME?
  }

  return context;
};

const updateThumbnail = async (context) => {
  if (context.params.url) {
    return updateThumbnailFromUrl({
      url: context.params.url,
      filename: context.id,
    });
  }
  return context;
};

module.exports = {
  before: {
    all: [prepData],
    find: [fullTextSearch, fetchUnified],
    get: [fetchUnified],
    create: [transaction.start(), setUser, setArchive],
    update: [transaction.start()],
    patch: [
      transaction.start(),
      setUser,
      updateListItemRelations,
      updateRelations,
      updateThumbnail,
    ],
    remove: [transaction.start()],
  },

  after: {
    all: [
      (context) => {
        if (context.params.knex) {
          context.result.query = context.params.knex.toString();
        }
        if (context.fullText) {
          context.result.fullText = context.fullText;
        }
      },
    ],
    find: [lookupFilters],
    get: [],
    create: [
      updateListItemRelations,
      updateRelations,
      updateThumbnail,
      refreshView,
      transaction.end(),
    ],
    update: [refreshView, transaction.end()],
    patch: [refreshView, transaction.end()],
    remove: [refreshView, transaction.end()],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [transaction.rollback()],
    update: [transaction.rollback()],
    patch: [transaction.rollback()],
    remove: [transaction.rollback()],
  },
};
