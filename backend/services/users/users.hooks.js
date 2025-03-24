const { authenticate } = require("@feathersjs/authentication").hooks;

const { hashPassword, protect } = require("@feathersjs/authentication-local").hooks;
const { generateRandomString } = require("../../utils");

const setArchive = (context) => {
  const {
    data,
    method,
    params: { user: { archive_id } = {} },
  } = context;
  if (archive_id && method === "create") {
    data.archive_id = archive_id;
  }
  return context;
};

const validateUser = (context) => {
  const {
    data: { password },
  } = context;
  if (password) {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    } else if (password.match(/^[A-z0-9]+$/)) {
      throw new Error("Password must contain at least one special character");
    }
  }
  return context;
};

const cleanData = (context) => {
  if (context.data) {
    ["full_name", "user_search"].forEach((key) => {
      delete context.data[key];
    });
  }

  if (context.method === "create" && !context.data.password) {
    context.data.password = generateRandomString();
  }
  return context;
};

module.exports = {
  before: {
    all: [cleanData],
    find: [],
    get: [],
    create: [hashPassword("password"), setArchive, authenticate("jwt")],
    update: [validateUser, hashPassword("password"), authenticate("jwt")],
    patch: [validateUser, hashPassword("password"), authenticate("jwt")],
    remove: [authenticate("jwt")],
  },

  after: {
    all: [
      // Make sure the password field is never sent to the client
      // Always must be the last hook
      protect("password"),
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
