import assert from "assert";
import app from "../backend/app.js";

describe("authentication", () => {
  it("registered the authentication service", () => {
    assert.ok(app.service("api/authentication"));
  });

  describe("local strategy", () => {
    const userInfo = {
      username: "someone@example.com2",
      password: "supersecret",
      archive_id: 1,
    };

    before(async () => {
      try {
        await app.service("api/users").create(userInfo, { user: { archive_id: 1 } });
      } catch (error) {
        // Do nothing, it just means the user already exists and can be tested
      }
    });

    it("authenticates user and creates accessToken", async () => {
      const { user, accessToken } = await app.service("api/authentication").create({
        strategy: "local",
        ...userInfo,
      });

      assert.ok(accessToken, "Created access token for user");
      assert.ok(user, "Includes user in authentication data");
    });
  });
});
