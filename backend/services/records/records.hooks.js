import {
  fetchUnified,
  prepListItemRelations,
  refreshView,
  setArchive,
  setUser,
  updateListItemRelations,
  updateThumbnail,
} from "../common_hooks/index.js";

// const tsquery = pgTsquery();

// const fullTextSearch = (context) => {
//   const {
//     service: { fullName },
//   } = context;
//   if (context.params.query.$fullText !== undefined) {
//     const { $fullText, ...query } = context.params.query;
//     const knex = context.app.service(`unified_${fullName}`).createQuery({ ...context.params, query });
//     if ($fullText) {
//       const fullTextQuery = tsquery($fullText);
//       context.fullText = fullTextQuery;
//       knex.select(
//         context.service.Model.raw(`ts_rank_cd(fulltext, to_tsquery('english', ?)) AS score`, [fullTextQuery])
//       );
//       knex.whereRaw(`fulltext @@ to_tsquery('english', ?)`, [fullTextQuery]);
//       knex.orderBy("score", "desc");
//     }
//     context.params.knex = knex;
//   }
// };

// const lookupFilters = async ({
//   params: {
//     knex,
//     query: { $fullText },
//     // transaction: { trx },
//   },
//   result,
//   service: { Model },
// }) => {
//   // console.log('AFTER FIND');
//   if ($fullText !== undefined) {
//     const ids = await knex.clearSelect().clearOrder().select("record_id").toString();
//     // await trx.raw(
//     //   `create temp table search_results3  on commit drop as ${ids}`
//     // );
//     // const subquery = `select record_id from search_results3`;
//     // console.log(res);
//     const subquery = ids;
//     const filters = (
//       await Promise.all(
//         [
//           `select
//           type, array_agg(jsonb_build_array(item, count::text) order by count desc) as values
//           from (
//             select
//               item, type, count(*) as count
//             from records_to_list_items a
//             join list_items b
//             using (list_item_id)
//             where record_id in (${subquery})
//             group by item, type
//             order by type
//           ) a group by type`,
//           `select 'year' as type, array_agg(jsonb_build_array(year, count::text) order by count desc, year) as values from (
//           select year::text, count(*) as count
//           from records
//           where record_id in (${subquery})
//           group by year
//         ) a`,
//           `select 'collection' as type, array_agg(jsonb_build_array(collection_name, count::text, collection_id) order by count desc, collection_name) as values from (
//           select collection_id, max(collection_name) as collection_name, count(*) as count
//           from records
//           join collections using (collection_id)
//           where record_id in (${subquery})
//           group by collection_id
//         ) a`,
//           `select 'title' as type, array_agg(jsonb_build_array(title, count::text) order by count desc, title) as values from (
//           select title, count(*) as count
//           from records
//           where record_id in (${subquery})
//           group by title
//         ) a`,
//         ].flatMap(async (query) => (await Model.raw(query)).rows.flat())
//       )
//     ).flat();
//     // await trx.raw(`drop table search_results3 `);
//     // console.log(filters);
//     result.filters = filters;
//   }
// };

const prepData = async (context) => {
  const { data, method } = context;
  if (data && Object.keys(data).length) {
    const relation_data = {};
    // remove calculated fields
    Object.keys(data).forEach((key) => {
      if (
        ["call_numbers", "formats", "qualitys", "generations", "media_types", "siblings", "relationships"].includes(
          key
        ) ||
        key.match("_search")
      ) {
        delete data[key];
      }
    });
    if ("date_string" in data) {
      let parts = ["month", "day", "year"];
      data.date_string?.split("/").forEach((part, index) => {
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
        delete data[key];
      }
    });

    if ("collection" in data) {
      data.collection_id = data.collection ? data.collection.collection_id : null;
      delete data.collection;
    }
    if ("parent" in data) {
      data.parent_record_id = data.parent ? data.parent.record_id : null;
      delete data.parent;
    }
    ["instances", "children", "continuations", "authors", "producers", "keywords", "subjects"].forEach((key) => {
      if (key in data) {
        relation_data[key] = data[key];
        delete data[key];
      }
    });
    context.relation_data = relation_data;
  }
  prepListItemRelations(context);
  if (method === "remove") {
    const { collection_id } = await context.app.service("api/records")._get(context.id, context.params);
    context.additional_views = [['collections', collection_id]];
  }
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
  const params = { user, transaction: { trx } };
  if (relation_data.instances !== undefined) {
    const instances = await Promise.all(
      relation_data.instances.map((instance) => {
        if (instance.delete) {
          return app.service("api/instances").remove(instance.instance_id, params);
        } else if (instance.instance_id) {
          if (instance.url === '') {
            instance.media_type = '';
          }
          return app.service("api/instances").patch(instance.instance_id, instance, params);
        }
        delete instance.instance_id;
        instance.record_id ||= id;
        return app.service("api/instances").create(instance, params);
      })
    );
    if (instances.length && !data.primary_instance_id) {
      await app.service("api/records")._patch(id, { primary_instance_id: instances[0].instance_id }, params);
    }
  }
  if (relation_data.children !== undefined) {
    await Promise.all(
      relation_data.children.map((child) => {
        if (child.delete) {
          return app.service("api/records").patch(child.record_id, { parent_record_id: null }, params);
        } else if (child.record_id && !child.parent_record_id) {
          return app.service("api/records").patch(child.record_id, { parent_record_id: id }, params);
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
      await trx("continuations").where({ continuation_id }).update({ continuation_records });
    } else {
      await trx("continuations").insert({
        continuation_records: [id, ...continuation_records],
      });
    }
    // delete data.new_continuation; FIXME?
  }
  return context;
};

export const before = {
  all: [prepData],
  find: [fetchUnified],
  get: [fetchUnified],
  create: [setUser, setArchive],
  patch: [setUser, updateListItemRelations, updateRelations],
  remove: [],
};
export const after = {
  all: [],
  find: [],
  get: [],
  create: [updateListItemRelations, updateThumbnail, updateRelations, refreshView],
  patch: [updateThumbnail, refreshView],
  remove: [refreshView],
};
export const error = {
  all: [],
  find: [],
  get: [],
  create: [],
  patch: [],
  remove: [],
};
export default {
  before,
  after,
  error,
};
