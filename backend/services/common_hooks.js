module.exports = {
  setUser: context => {
    const {data, method, service: {Model}, params: {user: {user_id}}} = context;
    if (method === 'create') {
      data.creator_user_id = user_id;
      data.date_created = Model.raw('now()');
    } else {
      data.contributor_user_id = user_id;
      data.date_modified = Model.raw('now()');
    }
    return context;
  },
  
  maskView: context => {
    context.service.table = context.path;
    return context;
  },

  unMaskView: context => {
    context.service.table = `unified_${context.path}`;
    return context;
  },

  updateListItemRelations: async context => {
    const {
      id,
      data,
      path,
      params: {
        transaction: { trx },
      },
    } = context;
    const table = path.slice(0, -1);
    for (const type of ['subjects', 'keywords', 'producers', 'authors']) {
      if (data[type] !== undefined) {
        // console.log('UPDATE', data);
  
        const ids = trx
          .from(`${table}s_to_list_items`)
          .join(
            'list_items',
            `${table}s_to_list_items.list_item_id`,
            'list_items.list_item_id'
          )
          .where('type', type.replace(/s$/, ''))
          .andWhere(`${table}_id`, id)
          .select(`${table}s_to_list_items.list_item_id`);
  
        await trx(`${table}s_to_list_items`).whereIn('list_item_id', ids).delete();
  
        await trx(`${table}s_to_list_items`).insert(
          data[type].map(({ list_item_id }) => ({ list_item_id, [`${table}_id`]: id }))
        );
        delete context.data[type];
        // console.log('UPDATE', context.data);
      }
    }
  
    if (!Object.keys(data).length) {
      context.result = await trx('records').where('record_id', id).select();
    }
    if ('collection' in data) {
      data.collection_id = data.collection ? data.collection.collection_id : null;
      delete data.collection;
    }
    // console.log('UPDATE DONE', context.result);
    return context;
  },

  refreshView: async (context) => {
    const {
      id,
      method,
      path,
      params: {
        transaction: { trx },
      },
    } = context;

    const table = path.slice(0, -1);

    if (['update', 'patch', 'remove'].includes(method)) {
      await trx(`unified_${table}s`).where(`${table}_id`, id).delete();
    }
    if (['update', 'patch', 'create'].includes(method)) {
      const [data] = await trx(`${table}s_view`).where(`${table}_id`, id).select();
      const encoded = {};
      Object.keys(data).forEach(key => {
        if (
          data[key] &&
          typeof data[key] === 'object' &&
          !key.includes('_search')
        ) {
          encoded[key] = JSON.stringify(data[key]);
        } else {
          encoded[key] = data[key];
        }
      });
      context.result = data;
      await trx(`unified_${table}s`).insert(encoded);
      return context;
    }
  }
  
};
