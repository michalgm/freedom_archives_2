const { Service } = require('feathers-knex');
const { authenticate } = require('@feathersjs/authentication').hooks;
const { hooks: { transaction } } = require('feathers-knex');

class Relationships extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'unknown_relations'
    });
  }
}

module.exports = function(app) {
  const options = {
    id: 'id',
    Model: app.get('knexClient'),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/relationships', new Relationships(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('relationships');

  const updateRelations = async (context) => {
    const { data: { type }, app, result } = context;
    if (type === 'unknown') {} else if (type === 'parent') {
      await app.service('records').patch(result.docid_2, { parent_record_id: result.docid_1 });
      await app.service('records').patch(result.docid_1, {});

    } else if (type === 'child') {
      await app.service('records').patch(result.docid_1, { parent_record_id: result.docid_2 });
      await app.service('records').patch(result.docid_2, {});
    } else if (type === 'sibling') {
      const record1 = await app.service('records').get(result.docid_1);
      let parent_id = record1.parent_record_id;
      if (!parent_id) {
        const record2 = await app.service('records').get(result.docid_2);
        parent_id = record2.parent_record_id;
      }
      if (parent_id) {
        await app.service('records').patch(result.docid_1, { parent_record_id: parent_id });
        await app.service('records').patch(result.docid_2, { parent_record_id: parent_id });
      }
    } else if (type === 'original') {
      await app.service('instances').patch(null, { record_id: result.docid_1 }, { query: { record_id: result.docid_2 } });
    } else if (type === 'instance') {
      await app.service('instances').patch(null, { record_id: result.docid_2 }, { query: { record_id: result.docid_1 } });
    }
    // console.log('####', type, result);
    return context;
  };

  service.hooks({
    before: {
      all: [authenticate('jwt')],
      patch: [transaction.start()]
    },
    after: {
      patch: [updateRelations, transaction.end()]
    },
    error: {
      patch: [transaction.rollback()],
    }
  });
};