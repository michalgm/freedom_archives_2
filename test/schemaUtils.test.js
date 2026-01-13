import { pick } from "lodash-es";
import { describe, it, expect } from "vitest";

import { isEmptyValue, removeNulls, getDefaultValuesFromSchema, parseError, getFieldLabel } from "../backend/schema/schemaUtils.js";

// Helpers

describe("schemaUtils", () => {
  describe("isEmptyValue", () => {
    it("returns true for undefined, null, empty string, empty array, empty object", () => {
      expect(isEmptyValue(undefined)).toBe(true);
      expect(isEmptyValue(null)).toBe(true);
      expect(isEmptyValue("")).toBe(true);
      expect(isEmptyValue([])).toBe(true);
      expect(isEmptyValue({})).toBe(true);
    });

    it("returns false for non-empty values", () => {
      expect(isEmptyValue(0)).toBe(false);
      expect(isEmptyValue("a")).toBe(false);
      expect(isEmptyValue([1])).toBe(false);
      expect(isEmptyValue({ a: 1 })).toBe(false);
    });
  });

  describe("removeNulls", () => {
    it("recursively strips nullish/empty values", () => {
      const input = {
        a: null,
        b: "text",
        c: [],
        d: [null, 1, ""],
        e: { x: undefined, y: 2, z: {} },
      };
      const result = removeNulls(input);
      expect(result).toEqual({ b: "text", d: [1], e: { y: 2 } });
    });
  });

  describe("getDefaultValuesFromSchema", () => {
    it("materializes defaults from recordsDataSchema", () => {
      const defaults = getDefaultValuesFromSchema("records", {}, false);
      // Expect core defaults to be present
      const subset = pick(defaults, ["title", "description", "is_hidden", "needs_review", "year_is_circa"]);
      expect(subset).toEqual({
        is_hidden: false,
        needs_review: false,
        year_is_circa: false,
      });
      // media has a min(1) constraint but no default; the extractor returns undefined/omits empty arrays
      expect(!("media" in defaults) || Array.isArray(defaults.media)).toBe(true);
    });

    it("materializes defaults from recordsDataSchema including null/blank values", () => {
      const defaults = getDefaultValuesFromSchema("records", {}, true);
      // Expect core defaults to be present
      const subset = pick(defaults, ["title", "description", "is_hidden", "needs_review", "year_is_circa"]);
      expect(subset).toEqual({
        description: "",
        title: "",
        is_hidden: false,
        needs_review: false,
        year_is_circa: false,
      });
      // media has a min(1) constraint but no default; the extractor returns undefined/omits empty arrays
      expect(!("media" in defaults) || Array.isArray(defaults.media)).toBe(true);
    });
  });

  describe("parseError", () => {
    it("formats a zod issue-like object", () => {
      const formatter = parseError("field_name");
      const msg = formatter({ message: "Invalid input" });
      expect(msg).toBe("Field Name: Invalid input");
    });
  });

  describe("getFieldLabel", () => {
    it("retrieves field labels from fieldLabels mapping", () => {
      const label = getFieldLabel("date_string", "records", false);
      expect(label).toBe("Date");

      const labelNested = getFieldLabel("media.url", "records");
      expect(labelNested).toBe("URL");

      const labelNestedFullPath = getFieldLabel("media.url", "records", true);
      expect(labelNestedFullPath).toBe("URL of the Media");

      const labelNestedArray = getFieldLabel("media[0].url", "records", true);
      expect(labelNestedArray).toBe("URL of the 1st Media entry");

      const labelNestedArray2 = getFieldLabel("media[1].no_copies", "records", true);
      expect(labelNestedArray2).toBe("Copies Count of the 2nd Media entry");

    });
  });
});
