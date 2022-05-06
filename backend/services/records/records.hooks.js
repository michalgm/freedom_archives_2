const tsquery = require('pg-tsquery')();
const {
  hooks: { transaction },
} = require('feathers-knex');
const {
  setUser,
  updateListItemRelations,
  refreshView,
  updateThumbnailFromUrl,
  fetchUnified
} = require('../common_hooks/');

const fullTextSearch = context => {
  if (context.params.query.$fullText !== undefined) {
    const { $fullText, ...query } = context.params.query;
    const knex = context.app.service(`unified_${context.path}`).createQuery({ ...context.params, query });
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
      knex.orderBy('score', 'desc');
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
      .select('record_id')
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
        ].flatMap(async query => (await Model.raw(query)).rows.flat())
      )
    ).flat();

    // await trx.raw(`drop table search_results3 `);

    // console.log(filters);
    result.filters = filters;
  }
};

const updateRelations = async context => {
  const {
    id,
    app,
    params: {
      user,
      transaction: { trx },
    },
    data,
  } = context;

  if (!Object.keys(data).length) {
    context.result = await trx('records').where('record_id', id).select();
  }
  if (data.date_string) {
    const [month, day, year] = data.date_string.split("/");
    data.month = month;
    data.day = day;
    data.year = year;
    delete data.date_string;
  }
  if (data.instances !== undefined) {
    await Promise.all(
      data.instances.map(instance => {
        if (instance.delete) {
          return app.service('instances').remove(instance.instance_id, { user, transaction: { trx } });
        } else if (instance.instance_id) {
          return app.service('instances').patch(instance.instance_id, instance, { user, transaction: { trx } });
        }
        delete instance.instance_id;
        return app.service('instances').create(instance, { user, transaction: { trx } });
      })
    );
    delete data.instances;
  }

  if (data.children !== undefined) {
    await Promise.all(
      data.children.map(child => {
        if (child.delete) {
          return app.service('records').patch(child.record_id, { parent_record_id: null }, { user, transaction: { trx } });
        } else if (child.record_id && !child.parent_record_id) {
          return app.service('records').patch(child.record_id, { parent_record_id: id }, { user, transaction: { trx } });
        }
      })
    );
    delete data.children;
  }

  if (data.continuations !== undefined) {
    const { continuation_id } = data.continuations[0] || {};

    const continuation_records = data.continuations
      .filter(record => !record.delete)
      .map(record => record.record_id);

    if (continuation_id) {
      await trx('continuations').where({ continuation_id }).update({ continuation_records });
    } else {
      await trx('continuations').insert({ continuation_records: [id, ...continuation_records] });
    }

    delete data.continuations;
    delete data.new_continuation;
  }

  ['program', 'publisher'].forEach(key => {
    if (key in data) {
      data[`${key}_id`] = data[key] ? data[key].list_item_id : null;
      delete data[key];
    }
  });
  if ('collection' in data) {
    data.collection_id = data.collection ? data.collection.collection_id : null;
    delete data.collection;
  }
  if ('parent' in data) {
    data.parent_record_id = data.parent ? data.parent.record_id : null;
    delete data.parent;
  }
  Object.keys(data).forEach(key => {
    if (['call_numbers', 'formats', 'qualitys', 'generations', 'media_types', 'siblings', 'relationships'].includes(key) || key.match('_search')) {
      delete data[key];
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  return context;
};

const updateThumbnail = async context => {
  if (context.params.url) {
    return updateThumbnailFromUrl({ url: context.params.url, filename: context.id });
  }
  return context;
};

module.exports = {
  before: {
    all: [],
    find: [fullTextSearch, fetchUnified],
    get: [
      fetchUnified,
    ],
    create: [
      transaction.start(),
      setUser,
      updateListItemRelations,
      updateRelations,
    ],
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
      context => {
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
    create: [refreshView, transaction.end()],
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
