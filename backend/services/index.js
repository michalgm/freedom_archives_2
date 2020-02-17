const users = require('./users/users.service.js');
const records = require('./records/records.service.js');
const relationships = require('./relationships.js');
const list_items = require('./list_items.js');
// eslint-disable-next-line no-unused-vars
module.exports = function(app) {
  app.configure(users);
  app.configure(records);
  app.configure(relationships);
  app.configure(list_items);
};
