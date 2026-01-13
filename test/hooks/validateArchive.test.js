import { describe, it, beforeEach, afterEach } from 'vitest';
import { expect } from 'vitest';
import sinon from "sinon";

import { validateArchive } from "../../backend/services/common_hooks/index.js";

describe("validateArchive hook", () => {
  let consoleLogStub;

  beforeEach(() => {
    // Stub console.log before each test
    consoleLogStub = sinon.stub(console, "log");
  });

  afterEach(() => {
    // Restore console.log after each test
    consoleLogStub.restore();
  });

  it("should do nothing when user has no archive_id", () => {
    const context = {
      params: {
        user: {},
        query: { archive_id: 1 },
        data: { archive_id: 1 },
      },
    };

    const result = validateArchive(context);
    expect(result).toBeUndefined();
  });

  it("should do nothing when archive_ids match", () => {
    const context = {
      params: {
        user: { archive_id: 1 },
        query: { archive_id: 1 },
        data: { archive_id: 1 },
      },
      method: "find",
    };

    const result = validateArchive(context);
    expect(result).toBeUndefined();
  });

  it("should throw error when query archive_id does not match user archive_id", () => {
    const context = {
      params: {
        user: { archive_id: 1 },
        query: { archive_id: 2 },
        data: {},
      },
      method: "find",
    };

    expect(() => {
      validateArchive(context);
    }).toThrow(/Archive mismatch/);
  });

  it("should throw error when data archive_id does not match user archive_id", () => {
    const context = {
      params: {
        user: { archive_id: 1 },
        query: {},
        data: { archive_id: 2 },
      },
      method: "create",
    };

    expect(() => {
      validateArchive(context);
    }).toThrow(/Archive mismatch/);
  });

  it("should handle missing query and data", () => {
    const context = {
      params: {
        user: { archive_id: 1 },
      },
      method: "get",
    };

    const result = validateArchive(context);
    expect(result).toBeUndefined();
  });
});
