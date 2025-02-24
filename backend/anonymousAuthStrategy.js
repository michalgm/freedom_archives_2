const { AuthenticationBaseStrategy } = require("@feathersjs/authentication");

class AnonymousStrategy extends AuthenticationBaseStrategy {
  async authenticate(authentication, params) {
    return {
      anonymous: true,
    };
  }
}

module.exports = AnonymousStrategy;
