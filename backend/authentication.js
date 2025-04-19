import authentication from "@feathersjs/authentication";
import authenticationLocal from "@feathersjs/authentication-local";

const { AuthenticationBaseStrategy } = authentication;
const { AuthenticationService, JWTStrategy } = authentication;
const { LocalStrategy } = authenticationLocal;
class AnonymousStrategy extends AuthenticationBaseStrategy {
  async authenticate() {
    return {
      anonymous: true,
    };
  }
}
export default (app) => {
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
