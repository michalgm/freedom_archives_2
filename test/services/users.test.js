import assert from "assert";
import app from "../../backend/app.js";

describe("'records' service", () => {
  it("registered the service", () => {
    const service = app.service("api/users");

    assert.ok(service, "Registered the service");
  });
});
