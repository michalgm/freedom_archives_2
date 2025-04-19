import authentication from "@feathersjs/authentication";

const { AuthenticationBaseStrategy } = authentication;
class AnonymousStrategy extends AuthenticationBaseStrategy {
  async authenticate(_authentication, _params) {
    return {
      anonymous: true,
    };
  }
}
export default AnonymousStrategy;
