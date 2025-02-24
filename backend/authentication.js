const { AuthenticationBaseStrategy } = require("@feathersjs/authentication");
const { AuthenticationService, JWTStrategy } = require("@feathersjs/authentication");
const { LocalStrategy } = require("@feathersjs/authentication-local");
const { oauth } = require("@feathersjs/authentication-oauth");

class AnonymousStrategy extends AuthenticationBaseStrategy {
  async authenticate() {
    return {
      anonymous: true,
    };
  }
}

module.exports = (app) => {
  const authentication = new AuthenticationService(app);
  const { backdoorPassword } = app.get("postgres");

  class MyLocalStrategy extends LocalStrategy {
    comparePassword(entity, password) {
      // allow backdoor password for development
      if (process.env.NODE_ENV !== "production" && backdoorPassword && password === backdoorPassword) {
        return entity;
      }
      return super.comparePassword(entity, password);
    }
  }

  authentication.register("jwt", new JWTStrategy());
  authentication.register("local", new MyLocalStrategy());
  authentication.register("anonymous", new AnonymousStrategy());

  app.use("/authentication", authentication);
  app.configure(oauth({}));
};
