const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { oauth } = require("@feathersjs/authentication-oauth");

module.exports = app => {
  const authentication = new AuthenticationService(app);
  const { backdoorPassword } = app.get('postgres');

  class MyLocalStrategy extends LocalStrategy {
    comparePassword(entity, password) {
      // allow backdoor password for development
      if (process.env.NODE_ENV !== 'production' && backdoorPassword && password === backdoorPassword) {
        return entity;
      }
      return super.comparePassword(entity, password);
    }
  }

  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new MyLocalStrategy());

  app.use('/authentication', authentication);
  app.configure(oauth({}));
};
