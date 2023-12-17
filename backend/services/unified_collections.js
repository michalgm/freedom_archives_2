// Initializes the `collections` service on path `/collections`
const {Service} = require('feathers-knex');

class UnifiedCollections extends Service {
  constructor(options) {
    super({
      ...options,
      name: "unified_collections",
      filters: {
        $fullText: (v) => v,
      },
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
  app.use('/unified_collections', new UnifiedCollections(options, app));

};
