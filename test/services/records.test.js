const assert = require("assert");
const app = require("../../backend/app");

describe("'records' service", () => {
  it("registered the service", () => {
    const service = app.service("api/records");

    assert.ok(service, "Registered the service");
  });
});
