import authentication from "@feathersjs/authentication";
const { AuthenticationBaseStrategy } = authentication;
class AnonymousStrategy extends AuthenticationBaseStrategy {
  async authenticate(authentication, params) {
    return {
      anonymous: true,
    };
  }
}
export default AnonymousStrategy;
