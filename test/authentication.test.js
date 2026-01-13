import sinon from 'sinon';
import { describe, it, beforeAll, afterAll, beforeEach, expect, assert } from 'vitest';

import app from "../backend/app.js";

let sandbox;

describe("authentication", () => {
  beforeAll(async () => {
    sandbox = sinon.createSandbox();
  });

  afterAll(() => {
    sandbox.restore();
  });

  it("registered the authentication service", () => {
    expect(app.service("api/authentication")).toBeDefined();
  });

  describe("local strategy", () => {
    const adminUser = {
      archive_id: 1,
      role: "administrator",
    };

    const userInfo = {
      username: "someone@example.com",
      password: "supersecret!!",
      archive_id: 1,
      active: true,
    };

    beforeEach(async () => {
      const { data: [user] } = await app.service('api/users').find({
        query: {
          username: userInfo.username,
          $limit: 1,
        },
      });
      if (!user) {
        app.service("api/users").create(userInfo, { user: adminUser });
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
