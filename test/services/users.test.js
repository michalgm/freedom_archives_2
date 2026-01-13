import { describe, it, expect } from 'vitest';

import app from "../../backend/app.js";

describe("'records' service", () => {
  it("registered the service", () => {
    const service = app.service("api/users");

    expect(service).toBeDefined();
  });
});
