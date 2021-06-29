const {Service} = require('feathers-knex');
const {
  hooks: { transaction },
} = require('feathers-knex');
const {setUser, updateListItemRelations, refreshView, fetchUnified} = require('./common_hooks/');

class Collections extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'collections',
    });
  }
}


module.exports = function (app) {
  const options = {
    id: 'collection_id',
    Model: app.get('knexClient'),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/collections', new Collections(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('collections');

  const updateRelations = async context => {
    const {
      id,
      app,
      params: {
        user,
        transaction: {trx},
      },
      data,
    } = context;

    if (!Object.keys(data).length) {
      context.result = await trx('collections').where('collections_id', id).select();
    }

    if (data.children !== undefined) {
      await Promise.all(
        data.children.map(child => {
          if (child.delete) {
            return app.service('records').patch(child.record_id, {parent_record_id: null}, {user, transaction: {trx}});
          } else if (child.record_id && !child.parent_record_id) {
            return app.service('records').patch(child.record_id, {parent_record_id: id}, {user, transaction: {trx}});
          }
        })
      );
      delete data.children;
    }

    if ('publisher' in data) {
      data[`publisher_id`] = data['publisher'] ? data['publisher'].list_item_id : null;
      delete data['publisher'];
    }
    // if ('collection' in data) {
    //   data.collection_id = data.collection ? data.collection.collection_id : null;
    //   delete data.collection;
    // }
    if ('parent' in data) {
      data.parent_collection_id = data.parent ? data.parent.collection_id : null;
      delete data.parent;
    }
    return context;
  };
  
  service.hooks({
    before: {
      all: [],
      get: [fetchUnified],
      find: [fetchUnified],
      create: [transaction.start(), setUser, updateListItemRelations, updateRelations],
      patch: [transaction.start(), setUser, updateListItemRelations, updateRelations],
      remove: [transaction.start()],
    },
    after: {
      all: [],
      create: [refreshView, transaction.end()],
      update: [refreshView, transaction.end()],
      patch: [refreshView, transaction.end()],
      remove: [refreshView, transaction.end()],
    },
    error: {
      all: [],
      create: [transaction.rollback()],
      patch: [transaction.rollback()],
      remove: [transaction.rollback()],
    },
  });
};
