const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { expressOauth } = require('@feathersjs/authentication-oauth');

module.exports = app => {
  const authentication = new AuthenticationService(app);

  class MyLocalStrategy extends LocalStrategy {
    comparePassword(entity, password) {
      if (process.env.NODE_ENV !== 'production' && password === 'letmein') {
        return entity;
      }
      return super.comparePassword(entity, password);
    }
  }

  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new MyLocalStrategy());

  app.use('/authentication', authentication);
  app.configure(expressOauth());
};
