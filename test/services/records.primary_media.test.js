import { afterAll, describe, expect, it } from "vitest";

import app from "../../backend/app.js";

const TEST_COLLECTION_ID = 1000;

afterAll(async () => {
  await app.get("postgresqlClient").raw('delete from "records" where title like ?', ["__vitest_primary_media_%"]);
});

describe("records primary_media_id behavior", () => {
  it("does not change primary_media_id on delete-only media patch", async () => {
    const uniq = `__vitest_primary_media_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const params = {
      user: { user_id: 4, archive_id: 1, role: "administrator" },
    };

    const title = `${uniq}_record`;

    let recordId;

    try {
      await app.service("api/records").create(
        {
          title,
          collection_id: TEST_COLLECTION_ID,
          media: [
            { url: "", media_type: "" },
            { url: "", media_type: "" },
          ],
        },
        params,
      );

      const recordsResult = await app.service("api/records").find({
        ...params,
        query: { title, $disable_pagination: true },
      });
      expect(Array.isArray(recordsResult)).toBe(true);
      expect(recordsResult.length).toBe(1);

      recordId = Number(recordsResult[0].record_id);
      expect(recordId).toBeTruthy();

      const recordRow = await app.service("api/records").get(recordId, params);
      const mediaRows = await app.service("api/media").find({
        ...params,
        query: { record_id: recordId, $disable_pagination: true },
      });
      expect(Array.isArray(mediaRows)).toBe(true);
      expect(mediaRows.length).toBe(2);
      const mediaIds = mediaRows.map((m) => m.media_id);

      const initialPrimaryMediaId = recordRow.primary_media_id;
      expect(initialPrimaryMediaId).toBeTruthy();

      const nonPrimaryMediaId = mediaIds.find((id) => id !== initialPrimaryMediaId);
      expect(nonPrimaryMediaId).toBeTruthy();

      await app.service("api/records").patch(
        recordId,
        {
          media: mediaRows.map((m) => (m.media_id === nonPrimaryMediaId ? { ...m, delete: true } : m)),
        },
        params,
      );

      const afterRecord = await app.service("api/records").get(recordId, params);
      expect(afterRecord.primary_media_id).toBe(initialPrimaryMediaId);

      const remainingMedia = await app.service("api/media").find({
        ...params,
        query: { record_id: recordId, $disable_pagination: true },
      });
      expect(remainingMedia.map((r) => r.media_id).sort((a, b) => a - b)).toEqual([initialPrimaryMediaId]);
    } finally {
      if (recordId) {
        const remainingMedia = await app.service("api/media").find({
          ...params,
          query: { record_id: recordId, $disable_pagination: true },
        });
        await Promise.all(remainingMedia.map((m) => app.service("api/media").remove(m.media_id, params)));
        await app.service("api/records").remove(recordId, params);
      }
    }
  });

  it("moves primary_media_id when the primary media is deleted", async () => {
    const uniq = `__vitest_primary_media_delete_primary_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const params = {
      user: { archive_id: 1, role: "administrator" },
    };

    const title = `${uniq}_record`;

    let recordId;

    try {
      await app.service("api/records").create(
        {
          title,
          collection_id: TEST_COLLECTION_ID,
          media: [
            { url: "", media_type: "" },
            { url: "", media_type: "" },
          ],
        },
        params,
      );

      const recordsResult = await app.service("api/records").find({
        ...params,
        query: { title, $disable_pagination: true },
      });
      expect(Array.isArray(recordsResult)).toBe(true);
      expect(recordsResult.length).toBe(1);
      recordId = Number(recordsResult[0].record_id);
      expect(recordId).toBeTruthy();

      const recordRow = await app.service("api/records").get(recordId, params);
      const initialPrimary = recordRow.primary_media_id;
      expect(initialPrimary).toBeTruthy();

      const mediaRows = await app.service("api/media").find({
        ...params,
        query: { record_id: recordId, $disable_pagination: true },
      });
      expect(mediaRows.length).toBe(2);
      const allMediaIds = mediaRows.map((m) => m.media_id);
      const remainingId = allMediaIds.find((id) => id !== initialPrimary);
      expect(remainingId).toBeTruthy();

      await app.service("api/records").patch(
        recordId,
        {
          media: [{ media_id: initialPrimary, delete: true }],
        },
        params,
      );

      const afterRecord = await app.service("api/records").get(recordId, params);
      expect(afterRecord.primary_media_id).toBe(remainingId);

      const remainingMedia = await app.service("api/media").find({
        ...params,
        query: { record_id: recordId, $disable_pagination: true },
      });
      expect(remainingMedia.map((r) => r.media_id)).toEqual([remainingId]);
    } finally {
      if (recordId) {
        const remainingMedia = await app.service("api/media").find({
          ...params,
          query: { record_id: recordId, $disable_pagination: true },
        });
        await Promise.all(remainingMedia.map((m) => app.service("api/media").remove(m.media_id, params)));
        await app.service("api/records").remove(recordId, params);
      }
    }
  });

  it("sets primary_media_id to null when the last media is deleted", async () => {
    const knex = app.get("postgresqlClient");
    const uniq = `__vitest_primary_media_delete_last_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await knex.raw(
      'insert into "archives" ("archive_id", "title") values (?, ?) on conflict ("archive_id") do nothing',
      [1, "Test Archive"],
    );

    const params = {
      user: { archive_id: 1, role: "administrator" },
    };

    const title = `${uniq}_record`;
    let recordId;

    try {
      await app.service("api/records").create(
        {
          title,
          collection_id: TEST_COLLECTION_ID,
          media: [{ url: "", media_type: "" }],
        },
        params,
      );

      const recordsResult = await app.service("api/records").find({
        ...params,
        query: { title, $disable_pagination: true },
      });
      expect(Array.isArray(recordsResult)).toBe(true);
      expect(recordsResult.length).toBe(1);
      recordId = Number(recordsResult[0].record_id);

      const recordRow = await app.service("api/records").get(recordId, params);
      const primary = recordRow.primary_media_id;
      expect(primary).toBeTruthy();

      const mediaRows = await app.service("api/media").find({
        ...params,
        query: { record_id: recordId, $disable_pagination: true },
      });
      expect(mediaRows.map((m) => m.media_id)).toEqual([primary]);

      await app.service("api/records").patch(
        recordId,
        {
          media: [{ media_id: primary, delete: true }],
        },
        params,
      );

      const afterRecord = await app.service("api/records").get(recordId, params);
      expect(afterRecord.primary_media_id).toBeNull();

      const remainingMedia = await app.service("api/media").find({
        ...params,
        query: { record_id: recordId, $disable_pagination: true },
      });
      expect(remainingMedia.length).toBe(0);
    } finally {
      if (recordId) {
        const remainingMedia = await app.service("api/media").find({
          ...params,
          query: { record_id: recordId, $disable_pagination: true },
        });
        await Promise.all(remainingMedia.map((m) => app.service("api/media").remove(m.media_id, params)));
        await app.service("api/records").remove(recordId, params);
      }
    }
  });
});
