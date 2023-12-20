// Application hooks that run for every service
const { authenticate } = require("@feathersjs/authentication").hooks;
const {
  hooks: { transaction },
} = require("feathers-knex");
const checkAuth = async (context) => {
  if (context.path !== "authentication") {
    return authenticate("jwt")(context);
  }
  return context;
};

module.exports = {
  before: {
    all: [checkAuth],
    find: [],
    get: [],
    create: [transaction.start()],
    update: [transaction.start()],
    patch: [transaction.start()],
    remove: [transaction.start()],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [transaction.end()],
    update: [transaction.end()],
    patch: [transaction.end()],
    remove: [transaction.end()],
  },

  error: {
    all: [
      async (context) => {
        console.error(
          `Error in ${context.path} calling ${context.method}  method on ${context.id}`,
          context.error.message,
          context.error.stack
        );
        return context;
      },
    ],
    find: [],
    get: [],
    create: [transaction.rollback()],
    update: [transaction.rollback()],
    patch: [transaction.rollback()],
    remove: [transaction.rollback()],
  },
};
