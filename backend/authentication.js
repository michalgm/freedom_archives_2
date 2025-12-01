import authentication from "@feathersjs/authentication";
import authenticationLocal from "@feathersjs/authentication-local";
import { Forbidden } from "@feathersjs/errors";

import AnonymousStrategy from "./anonymousAuthStrategy.js";

const { AuthenticationService, JWTStrategy } = authentication;
const { LocalStrategy } = authenticationLocal;
export default (app) => {
  const authentication = new AuthenticationService(app);
  class MyLocalStrategy extends LocalStrategy {
    findEntity(username, params) {
      return super.findEntity(username.toLowerCase(), params);
    }
    comparePassword(entity, password) {
      if (!entity.active) {
        throw new Forbidden(`The account for user "${entity.username}" has been deactivated`);
      }
      return super.comparePassword(entity, password);
    }

  }
  authentication.register("jwt", new JWTStrategy());
  authentication.register("local", new MyLocalStrategy());
  authentication.register("anonymous", new AnonymousStrategy());
  app.use("/api/authentication", authentication);
};
