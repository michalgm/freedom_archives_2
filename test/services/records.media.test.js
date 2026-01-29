import { describe, expect, it } from "vitest";

import app from "../../backend/app.js";

describe("records media create/remove", () => {
  it("creates and deletes a media item via records.patch", async () => {
    const db = app.get("postgresqlClient");
    const uniq = `__vitest_record_media_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // Unified record views appear to exclude records without a collection_id.
    const TEST_COLLECTION_ID = 1000;

    // Ensure archive exists (records/archive_id FK).
    await db("archives").insert({ archive_id: 1, title: "Test Archive" }).onConflict(["archive_id"]).ignore();

    const params = { user: { archive_id: 1, role: "administrator" } };

    // Use empty url so updateThumbnail hook doesn't try to download.
    const recordTitle = `${uniq}_record`;
    await app.service("api/records").create(
      {
        title: recordTitle,
        collection_id: TEST_COLLECTION_ID,
        media: [
          {
            url: "",
            media_type: "",
          },
        ],
      },
      params,
    );

    const recordsResult = await app.service("api/records").find({
      ...params,
      query: { title: recordTitle, $disable_pagination: true },
    });
    expect(Array.isArray(recordsResult)).toBe(true);
    expect(recordsResult.length).toBe(1);
    const recordId = Number(recordsResult[0].record_id);
    expect(Number.isInteger(recordId)).toBe(true);

    const mediaRows = await app.service("api/media").find({
      ...params,
      query: { record_id: recordId, $disable_pagination: true },
    });
    expect(Array.isArray(mediaRows)).toBe(true);
    expect(mediaRows.length).toBe(1);
    const mediaId = Number(mediaRows[0].media_id);
    expect(Number.isInteger(mediaId)).toBe(true);

    await expect(
      app.service("api/records").patch(
        recordId,
        {
          media: [
            {
              media_id: mediaId,
              delete: true,
            },
          ],
        },
        params,
      ),
    ).resolves.toBeTruthy();

    const mediaAfter = await app.service("api/media").find({
      ...params,
      query: { media_id: mediaId, $disable_pagination: true },
    });
    expect(Array.isArray(mediaAfter)).toBe(true);
    expect(mediaAfter.length).toBe(0);

    // Cleanup record (best effort; media is already deleted).
    await app.service("api/records").remove(recordId, params);
  });
});
