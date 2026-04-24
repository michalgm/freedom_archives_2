import { BadRequest } from "@feathersjs/errors";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../backend/app.js";

const adminUser = {
  archive_id: 1,
  role: "administrator",
};

describe.sequential("'list_items' service", () => {
  let db;

  beforeEach(() => {
    db = app.get("postgresqlClient");
  });

  afterAll(async () => {
    await app.get("postgresqlClient").raw('delete from "list_items" where item like ?', ["__vitest_dup_%"]);
    await app.get("postgresqlClient").raw('delete from "list_items" where item like ?', ["__vitest_value_%"]);
    await app.get("postgresqlClient").raw('delete from "list_items" where item like ?', ["__vitest_merge_rec_%"]);
    await app.get("postgresqlClient").raw('delete from "list_items" where item like ?', ["__vitest_merge_col_%"]);
    await app.get("postgresqlClient").raw('delete from "list_items" where item like ?', ["__vitest_fmt_%"]);
    await app.get("postgresqlClient").raw('delete from "collections" where title like ?', ["__vitest_merge_col_%"]);
    await app.get("postgresqlClient").raw('delete from "records" where title like ?', ["__vitest_merge_rec_%"]);
  });

  it("registered the service", () => {
    const service = app.service("api/list_items");
    expect(service).toBeDefined();
  });

  describe("duplicate key error handling for records", () => {
    it("returns custom error message when updating item with duplicate key for records type", async () => {
      const uniq = `__vitest_dup_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      // Create two items of the same type
      const [item1] = await db("list_items")
        .insert({
          archive_id: 1,
          type: "author",
          item: `${uniq}_author_1`,
        })
        .returning(["list_item_id"]);

      const [item2] = await db("list_items")
        .insert({
          archive_id: 1,
          type: "author",
          item: `${uniq}_author_2`,
        })
        .returning(["list_item_id"]);

      const item1Id = Number(item1.list_item_id);
      const item2Id = Number(item2.list_item_id);

      try {
        // Try to update item2 to have the same value as item1 (should violate unique constraint)
        try {
          await app.service("api/list_items").patch(item2Id, { item: `${uniq}_author_1` }, { user: adminUser });
          expect.fail("Should have thrown a BadRequest error");
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequest);
          expect(error.message).toContain("already exists");
          expect(error.message).toContain("merge");
        }
      } finally {
        // Cleanup
        await db("list_items").whereIn("list_item_id", [item1Id, item2Id]).delete();
      }
    });

    it("returns custom error message when updating item with duplicate key for collections type", async () => {
      const uniq = `__vitest_dup_col_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      // Create two items of collections type
      await db("list_items")
        .insert({
          archive_id: 1,
          type: "subject",
          item: `${uniq}_subject_1`,
        })
        .returning(["list_item_id"]);

      const [item2] = await db("list_items")
        .insert({
          archive_id: 1,
          type: "subject",
          item: `${uniq}_subject_2`,
        })
        .returning(["list_item_id"]);

      const item2Id = Number(item2.list_item_id);

      // Try to update item2 to have the same value as item1 (should violate unique constraint)
      try {
        await app.service("api/list_items").patch(item2Id, { item: `${uniq}_subject_1` }, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequest);
        expect(error.message).toContain("already exists");
        expect(error.message).toContain("merge");
      }
    });

    it("includes the conflicting item value in error message", async () => {
      const uniq = `__vitest_value_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const conflictingValue = `${uniq}_conflicting_value`;

      await db("list_items")
        .insert({
          archive_id: 1,
          type: "author",
          item: conflictingValue,
        })
        .returning(["list_item_id"]);

      const [item2] = await db("list_items")
        .insert({
          archive_id: 1,
          type: "author",
          item: `${uniq}_author_unique`,
        })
        .returning(["list_item_id"]);

      const item2Id = Number(item2.list_item_id);

      try {
        await app.service("api/list_items").patch(item2Id, { item: conflictingValue }, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequest);
        expect(error.message).toContain(conflictingValue);
      }
    });

    it("returns custom error message when creating item with duplicate key", async () => {
      const uniq = `__vitest_dup_create_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const [existing] = await db("list_items")
        .insert({ archive_id: 1, type: "author", item: uniq })
        .returning(["list_item_id"]);
      try {
        await app.service("api/list_items").create({ archive_id: 1, type: "author", item: uniq }, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequest);
        expect(error.message).toContain("already exists");
        expect(error.message).toContain("merge");
      } finally {
        await db("list_items").where("list_item_id", existing.list_item_id).delete();
      }
    });
  });

  describe("record_type for format items", () => {
    it("stores record_type in format_record_types on create and returns it in result", async () => {
      const uniq = `__vitest_fmt_${Date.now()}`;
      const result = await app
        .service("api/list_items")
        .create({ archive_id: 1, type: "format", item: uniq, record_type: "Audio" }, { user: adminUser });
      expect(result.record_type).toBe("Audio");
      const row = await db("format_record_types").where("list_item_id", result.list_item_id).first();
      expect(row?.record_type).toBe("Audio");
    });

    it("throws an error when creating a format item with invalid record_type", async () => {
      const uniq = `__vitest_fmt_${Date.now()}`;
      try {
        await app
          .service("api/list_items")
          .create({ archive_id: 1, type: "format", item: uniq, record_type: "InvalidType" }, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error.code).toBe("22P02");
        expect(error.message).toContain("invalid input value for enum record_type");
      }
    });

    it("throws an error when creating a format item without a record_type", async () => {
      const uniq = `__vitest_fmt_${Date.now()}`;
      try {
        await app.service("api/list_items").create({ archive_id: 1, type: "format", item: uniq }, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequest);
        expect(error.message).toContain("Missing record type for format item");
      }
    });

    it("upserts record_type when patching an existing format item", async () => {
      const uniq = `__vitest_fmt_patch_${Date.now()}`;
      const created = await app
        .service("api/list_items")
        .create({ archive_id: 1, type: "format", item: uniq, record_type: "Audio" }, { user: adminUser });
      const result = await app
        .service("api/list_items")
        .patch(created.list_item_id, { record_type: "Video" }, { user: adminUser });
      expect(result.record_type).toBe("Video");
      const row = await db("format_record_types").where("list_item_id", created.list_item_id).first();
      expect(row?.record_type).toBe("Video");
    });

    it("returns record_type when patching only record_type (no other fields changed)", async () => {
      const uniq = `__vitest_fmt_only_${Date.now()}`;
      const created = await app
        .service("api/list_items")
        .create({ archive_id: 1, type: "format", item: uniq, record_type: "Audio" }, { user: adminUser });
      // Patch with only record_type — after stripping it, data is empty, so the hook
      // short-circuits and returns the existing item directly
      const result = await app
        .service("api/list_items")
        .patch(created.list_item_id, { record_type: "Document" }, { user: adminUser });
      expect(result.record_type).toBe("Document");
    });

    it("does not resolve record_type for non-format item types", async () => {
      const uniq = `__vitest_fmt_author_${Date.now()}`;
      try {
        await app
          .service("api/list_items")
          .create({ archive_id: 1, type: "author", item: uniq, record_type: "Audio" }, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequest);
        expect(error.message).toContain("Only format items can have a record type");
      }
    });

    it("throws when patching a non-format item with record_type", async () => {
      const uniq = `__vitest_fmt_patch_err_${Date.now()}`;
      const [inserted] = await db("list_items")
        .insert({ archive_id: 1, type: "author", item: uniq })
        .returning(["list_item_id"]);
      try {
        await app
          .service("api/list_items")
          .patch(Number(inserted.list_item_id), { record_type: "Audio" }, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequest);
        expect(error.message).toContain("Only format items can have a record type");
      } finally {
        await db("list_items").where("list_item_id", inserted.list_item_id).delete();
      }
    });

    it("stores record_type and updates item in the same patch", async () => {
      const uniq = `__vitest_fmt_combined_${Date.now()}`;
      const created = await app
        .service("api/list_items")
        .create({ archive_id: 1, type: "format", item: uniq, record_type: "Audio" }, { user: adminUser });
      const result = await app
        .service("api/list_items")
        .patch(created.list_item_id, { item: `${uniq}_renamed`, record_type: "Video" }, { user: adminUser });
      expect(result.item).toBe(`${uniq}_renamed`);
      expect(result.record_type).toBe("Video");
      const row = await db("format_record_types").where("list_item_id", created.list_item_id).first();
      expect(row?.record_type).toBe("Video");
    });
  });

  describe("merge collision removal for records", () => {
    it("removes duplicate records_to_list_items links when merging authors", async () => {
      const uniq = `__vitest_merge_rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      // Create two author items
      const [sourceItem] = await db("list_items")
        .insert({
          archive_id: 1,
          type: "author",
          item: `${uniq}_source_author`,
        })
        .returning(["list_item_id"]);

      const [targetItem] = await db("list_items")
        .insert({
          archive_id: 1,
          type: "author",
          item: `${uniq}_target_author`,
        })
        .returning(["list_item_id"]);

      const sourceId = Number(sourceItem.list_item_id);
      const targetId = Number(targetItem.list_item_id);

      // Create a record
      const [record] = await db("records")
        .insert({
          archive_id: 1,
          title: `${uniq}_record`,
        })
        .returning(["record_id"]);

      const recordId = Number(record.record_id);

      // Link the record to BOTH source and target items (collision scenario)
      await db("records_to_list_items").insert([
        { record_id: recordId, list_item_id: sourceId },
        { record_id: recordId, list_item_id: targetId },
      ]);

      // Merge source into target
      await app.service("api/list_items").update(sourceId, { merge_target_id: targetId }, { user: adminUser });

      // Verify: the record should only have the target link
      const links = await db("records_to_list_items")
        .where({ record_id: recordId })
        .select(["record_id", "list_item_id"]);

      expect(links).toHaveLength(1);
      expect(links[0].list_item_id).toBe(targetId);
    }, 30_000);

    it("removes duplicate collections_to_list_items links when merging subjects", async () => {
      const uniq = `__vitest_merge_col_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      let sourceId, targetId, collectionId;

      // Create two subject items (used by collections)
      const [sourceItem] = await db("list_items")
        .insert({
          archive_id: 1,
          type: "subject",
          item: `${uniq}_source_subject`,
        })
        .returning(["list_item_id"]);

      const [targetItem] = await db("list_items")
        .insert({
          archive_id: 1,
          type: "subject",
          item: `${uniq}_target_subject`,
        })
        .returning(["list_item_id"]);

      sourceId = Number(sourceItem.list_item_id);
      targetId = Number(targetItem.list_item_id);

      // Create a collection with required fields
      const [collection] = await db("collections")
        .insert({
          archive_id: 1,
          title: `${uniq}_collection`,
          date_created: new Date(),
          date_modified: new Date(),
        })
        .returning(["collection_id"]);

      collectionId = Number(collection.collection_id);

      // Link the collection to BOTH source and target items (collision scenario)
      await db("collections_to_list_items").insert([
        { collection_id: collectionId, list_item_id: sourceId },
        { collection_id: collectionId, list_item_id: targetId },
      ]);

      // Merge source into target
      await app.service("api/list_items").update(sourceId, { merge_target_id: targetId }, { user: adminUser });

      // Verify: the collection should only have the target link
      const links = await db("collections_to_list_items")
        .where({ collection_id: collectionId })
        .select(["collection_id", "list_item_id"]);

      expect(links).toHaveLength(1);
      expect(links[0].list_item_id).toBe(targetId);
    }, 30_000);

    it("reassigns non-collision links from source to target and deletes source", async () => {
      const uniq = `__vitest_merge_rec_noncol_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const [sourceItem] = await db("list_items")
        .insert({ archive_id: 1, type: "author", item: `${uniq}_source` })
        .returning(["list_item_id"]);
      const [targetItem] = await db("list_items")
        .insert({ archive_id: 1, type: "author", item: `${uniq}_target` })
        .returning(["list_item_id"]);
      const [record] = await db("records")
        .insert({ archive_id: 1, title: `${uniq}_record` })
        .returning(["record_id"]);

      const sourceId = Number(sourceItem.list_item_id);
      const targetId = Number(targetItem.list_item_id);
      const recordId = Number(record.record_id);

      // Only source is linked — no collision on target
      await db("records_to_list_items").insert({ record_id: recordId, list_item_id: sourceId });

      await app.service("api/list_items").update(sourceId, { merge_target_id: targetId }, { user: adminUser });

      const links = await db("records_to_list_items").where({ record_id: recordId }).select(["list_item_id"]);
      expect(links).toHaveLength(1);
      expect(Number(links[0].list_item_id)).toBe(targetId);

      const sourceRow = await db("list_items").where("list_item_id", sourceId).first();
      expect(sourceRow).toBeUndefined();
    }, 30_000);
  });

  describe("merge error cases", () => {
    it("throws BadRequest when merge_target_id is missing", async () => {
      const uniq = `__vitest_merge_rec_noTarget_${Date.now()}`;
      const [item] = await db("list_items")
        .insert({ archive_id: 1, type: "author", item: uniq })
        .returning(["list_item_id"]);
      try {
        await app.service("api/list_items").update(Number(item.list_item_id), {}, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequest);
        expect(error.message).toContain("Missing merge target id");
      } finally {
        await db("list_items").where("list_item_id", item.list_item_id).delete();
      }
    });

    it("throws BadRequest when merging items of different types", async () => {
      const uniq = `__vitest_merge_rec_mismatch_${Date.now()}`;
      const [source] = await db("list_items")
        .insert({ archive_id: 1, type: "author", item: `${uniq}_author` })
        .returning(["list_item_id"]);
      const [target] = await db("list_items")
        .insert({ archive_id: 1, type: "subject", item: `${uniq}_subject` })
        .returning(["list_item_id"]);
      try {
        await app
          .service("api/list_items")
          .update(Number(source.list_item_id), { merge_target_id: Number(target.list_item_id) }, { user: adminUser });
        expect.fail("Should have thrown a BadRequest error");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequest);
        expect(error.message).toContain("Cannot merge items of different types");
      } finally {
        await db("list_items").whereIn("list_item_id", [source.list_item_id, target.list_item_id]).delete();
      }
    });
  });

  describe("fetchListItemsLookupResult", () => {
    it("find returns rows from the list_items_lookup view", async () => {
      const uniq = `__vitest_value_lookup_find_${Date.now()}`;
      const [inserted] = await db("list_items")
        .insert({ archive_id: 1, type: "author", item: uniq })
        .returning(["list_item_id"]);
      try {
        const result = await app
          .service("api/list_items")
          .find({ query: { list_item_id: Number(inserted.list_item_id) }, user: adminUser });
        const rows = Array.isArray(result) ? result : result.data;
        expect(rows).toHaveLength(1);
        expect(Number(rows[0].list_item_id)).toBe(Number(inserted.list_item_id));
        expect(rows[0].item).toBe(uniq);
      } finally {
        await db("list_items").where("list_item_id", inserted.list_item_id).delete();
      }
    });

    it("remove returns the deleted item's lookup data", async () => {
      const uniq = `__vitest_value_lookup_remove_${Date.now()}`;
      const [inserted] = await db("list_items")
        .insert({ archive_id: 1, type: "author", item: uniq })
        .returning(["list_item_id"]);
      const id = Number(inserted.list_item_id);

      const result = await app.service("api/list_items").remove(id, { user: adminUser });

      expect(Number(result.list_item_id)).toBe(id);
      expect(result.item).toBe(uniq);
      const row = await db("list_items").where("list_item_id", id).first();
      expect(row).toBeUndefined();
    });
  });
});
