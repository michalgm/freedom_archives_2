import { afterAll, describe, expect, it } from "vitest";

import app from "../../backend/app.js";

const adminUser = {
  archive_id: 1,
  role: "administrator",
};

afterAll(async () => {
  await app.get("postgresqlClient").raw('delete from "list_items" where item like ?', ["__vitest_merge_%"]);
  await app.get("postgresqlClient").raw('delete from "records" where title like ?', ["__vitest_merge_%"]);
});

describe("duplicate_list_items merge hook", () => {
  it("merges without violating records_to_list_items unique key", async () => {
    const db = app.get("postgresqlClient");
    const uniq = `__vitest_merge_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // Create two list items of the same type.it
    const [targetRow] = await db("list_items")
      .insert({
        archive_id: 1,
        type: "subject",
        item: `${uniq}_target`,
      })
      .returning(["list_item_id", "archive_id"]);

    const [sourceRow] = await db("list_items")
      .insert({
        archive_id: 1,
        type: "subject",
        item: `${uniq}_source`,
      })
      .returning(["list_item_id", "archive_id"]);

    const targetId = Number(targetRow.list_item_id);
    const sourceId = Number(sourceRow.list_item_id);

    // Create two records.
    const [record1] = await db("records")
      .insert({
        archive_id: 1,
        title: `${uniq}_record_1`,
      })
      .returning(["record_id"]);

    const [record2] = await db("records")
      .insert({
        archive_id: 1,
        title: `${uniq}_record_2`,
      })
      .returning(["record_id"]);

    const recordId1 = Number(record1.record_id);
    const recordId2 = Number(record2.record_id);

    // Reproduce the collision case:
    // record1 links to BOTH source and target.
    await db("records_to_list_items").insert([
      { record_id: recordId1, list_item_id: targetId },
      { record_id: recordId1, list_item_id: sourceId },
      { record_id: recordId2, list_item_id: sourceId },
    ]);

    // Call the duplicate_list_items merge hook.
    const pairId = `${Math.min(sourceId, targetId)}|${Math.max(sourceId, targetId)}`;

    await expect(
      app
        .service("api/duplicate_list_items")
        .patch(pairId, { source_id: sourceId, target_id: targetId }, { user: adminUser }),
    ).resolves.toMatchObject({
      ok: true,
      merged: { source_id: sourceId, target_id: targetId },
    });

    // // Assert: record1 has only the target link (source link removed)
    const r1Links = await db("records_to_list_items")
      .where({ record_id: recordId1 })
      .select(["record_id", "list_item_id"]);

    expect(r1Links.filter((r) => r.list_item_id === targetId)).toHaveLength(1);
    expect(r1Links.filter((r) => r.list_item_id === sourceId)).toHaveLength(0);

    // Assert: record2 source link was rewritten to target
    const r2Links = await db("records_to_list_items")
      .where({ record_id: recordId2 })
      .select(["record_id", "list_item_id"]);

    expect(r2Links.filter((r) => r.list_item_id === targetId)).toHaveLength(1);
    expect(r2Links.filter((r) => r.list_item_id === sourceId)).toHaveLength(0);

    // Assert: source list_item is deleted by list_items merge
    const sourceAfter = await db("list_items").where({ list_item_id: sourceId }).first(["list_item_id"]);
    expect(sourceAfter).toBeUndefined();
  }, 30_000);
});
