// Application hooks that run for every service
const {authenticate} = require('@feathersjs/authentication').hooks;

const checkAuth = async (context) => {
  if (context.path !== 'authentication') {
    return authenticate('jwt')(context);
  }
  return context;
};

module.exports = {
  before: {
    all: [checkAuth],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [async context => {
      console.error(`Error in ${context.path} calling ${context.method}  method on ${context.id}`, context.error.message, context.error.stack);
      return context;
    }],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
