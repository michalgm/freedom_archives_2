import { authenticate } from "@feathersjs/authentication";
import { transaction } from "@feathersjs/knex";
import { allowAnonymous, setArchive, validateArchive } from "./services/common_hooks/index.js";
// Application hooks that run for every service
const public_services = ["api/public_records"];
const checkAuth = async (context) => {
  if (public_services.includes(context.path)) {
    allowAnonymous()(context);
    return authenticate("jwt", "anonymous")(context);
  } else if (context.path !== "api/authentication") {
    return authenticate("jwt")(context);
  }
  return context;
};
export const before = {
  all: [checkAuth],
  find: [],
  get: [],
  create: [transaction.start(), setArchive], //FIXME for new archives/archive users
  update: [transaction.start()],
  patch: [transaction.start()],
  remove: [transaction.start()],
};
export const after = {
  all: [],
  find: [],
  get: [],
  create: [transaction.end()],
  update: [transaction.end()],
  patch: [transaction.end()],
  remove: [transaction.end()],
};
export const error = {
  all: [
    async (context) => {
      console.error("ERROR", context.error?.message);
      console.error("ERROR", context.error?.data);
      if (context.path === "api/authentication" && ["NotAuthenticated: jwt expired"].includes(context.error.message)) {
        console.error(`Auth error: ${context.error.message}`);
      } else {
        console.error(
          `Error in ${context.path} calling ${context.method} method on ${context.id}`,
          context.error.message,
          context.error.stack
        );
      }
      return context;
    },
  ],
  find: [],
  get: [],
  create: [transaction.rollback()],
  update: [transaction.rollback()],
  patch: [transaction.rollback()],
  remove: [transaction.rollback()],
};
export default {
  before,
  after,
  error,
};
