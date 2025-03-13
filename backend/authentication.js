const { AuthenticationBaseStrategy } = require("@feathersjs/authentication");
const { AuthenticationService, JWTStrategy } = require("@feathersjs/authentication");
const { LocalStrategy } = require("@feathersjs/authentication-local");

class AnonymousStrategy extends AuthenticationBaseStrategy {
  async authenticate() {
    return {
      anonymous: true,
    };
  }
}

module.exports = (app) => {
  const authentication = new AuthenticationService(app);

  class MyLocalStrategy extends LocalStrategy {
    comparePassword(entity, password) {
      return super.comparePassword(entity, password);
    }
  }

  authentication.register("jwt", new JWTStrategy());
  authentication.register("local", new MyLocalStrategy());
  authentication.register("anonymous", new AnonymousStrategy());

  app.use("/api/authentication", authentication);
};
