import { describe, it, expect } from "vitest";
import { parseError } from "../frontend/src/utils/parseError";
import React from "react";

describe("parseError", () => {
  it("returns a string as-is", () => {
    expect(parseError("something went wrong")).toBe("something went wrong");
  });

  it("returns a react element as-is", () => {
    const element = React.createElement("span", null, "Error details");
    expect(parseError(element)).toBe(element);
  });

  it("extracts message from an Error instance", () => {
    expect(parseError(new Error("network timeout"))).toBe("network timeout");
  });

  it("extracts message from a plain object with a message property", () => {
    expect(parseError({ message: "record not found" })).toBe("record not found");
  });

  it("JSON-stringifies a plain object with no message — no [object Object]", () => {
    const result = parseError({ code: 500, data: "oops" });
    expect(result).not.toBe("[object Object]");
    expect(result).toContain("500");
  });

  it("handles the wrapper object pattern from useAutoCompleteOptions", () => {
    // Previously: displayError({ severity: "error", message: e.message })
    // where e.message was undefined produced "[object Object]"
    expect(parseError({ severity: "error", message: undefined })).not.toBe("[object Object]");
  });

  it("handles null and undefined without throwing", () => {
    expect(parseError(null)).toBe("null");
    expect(parseError(undefined)).toBe("undefined");
  });

  it("maps known error messages to friendly text", () => {
    expect(parseError("jwt expired")).toBe("Your session has expired. Please log in again.");
    expect(parseError(new Error("jwt expired"))).toBe("Your session has expired. Please log in again.");
  });
});
