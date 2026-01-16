import { describe, it, expect } from 'vitest';

import app from "../../backend/app.js";

// Uses the real test DB configured in config/test.json.
// Keep this test sequential to reduce flakiness with shared DB state.
describe.sequential("'duplicate_records' service", () => {
  it('rewrites related_records and keeps record_id_1 <= record_id_2', async () => {
    const duplicateRecords = app.service('api/duplicate_records');
    const records = app.service('api/records');
    const knex = app.get('postgresqlClient');

    expect(duplicateRecords).toBeDefined();

    const adminUser = {
      archive_id: 1,
      role: 'administrator',
    };

    // Create 3 records so we can force a case where after merging
    // record_id_1 > record_id_2 and we must normalize the order.
    const r3 = await records.create(
      { title: `dup-test-related-r3-${Date.now()}`, collection_id: 1000 },
      { user: adminUser },
    );
    const r1 = await records.create(
      { title: `dup-test-related-r1-${Date.now()}`, collection_id: 1000 },
      { user: adminUser },
    );
    const r2 = await records.create(
      { title: `dup-test-related-r2-${Date.now()}`, collection_id: 1000 },
      { user: adminUser },
    );
    const dateStamp = Date.now();
    // Insert a related_records row that references the record being removed (r2)
    // and is intentionally out-of-order (record_id_1 > record_id_2).
    const [{ max: maxId }] = await knex('related_records').max('id as max');
    const relatedId = (Number(maxId) || 0) + 1;
    await knex('related_records').insert({
      id: relatedId,
      record_id_1: r2.record_id,
      record_id_2: r3.record_id,
    });

    // Merge r2 into r1 (keeps r1, removes r2).
    await duplicateRecords.patch(
      `${r1.record_id}%7C${r2.record_id}`,
      { title: `dup-test-merged-${dateStamp}` },
      { user: adminUser },
    );

    // related_records should have been rewritten from r2 -> r1 and normalized.
    const rr = await knex('related_records').where({ id: relatedId }).first();
    const updatedR1 = await records.get(r1.record_id);
    
    expect(updatedR1.title).toBe(`dup-test-merged-${dateStamp}`); // Confirm patch applied.
    // We expect r3 < r1 (because r3 was created first), so ordering should flip.
    expect(rr).toBeDefined();
    expect(rr.record_id_1).toBe(r3.record_id);
    expect(rr.record_id_2).toBe(r1.record_id);
    expect(rr.record_id_1).toBeLessThanOrEqual(rr.record_id_2);

    // And the removed record should be gone.
    await expect(records.get(r2.record_id)).rejects.toBeTruthy();

    // Cleanup (avoid leaving test data behind)
    await records.remove(r1.record_id, { user: adminUser });
    await records.remove(r3.record_id, { user: adminUser });
  }, 30000);
});
