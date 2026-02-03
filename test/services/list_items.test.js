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
  });
});
