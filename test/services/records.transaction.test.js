import sinon from "sinon";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../../backend/app.js";
import logger from "../../backend/logger.js";


// Verifies nested service calls participate in the same overall transaction:
// if media creation fails during records.create, the record insert should be rolled back.
describe("records transactional behavior", () => {
  beforeAll(async () => {
    // Keep expected error-path tests quiet.
    sinon.stub(logger, "error");
  });

  afterAll(async () => {
    if (logger.error.restore) logger.error.restore();
    await app.get("postgresqlClient").raw('delete from "records" where title like ?', ["__vitest_records_tx _%"]);
  });

  it("rolls back record create if nested media.create fails", async () => {
    const uniq = `__vitest_records_tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const recordTitle = `${uniq}_record`;
    const failingUrl = `${uniq}_fail_media_create`;

    const params = {
      user: { archive_id: 1, role: "administrator" },
    };

    // Install a media hook that fails only for this test's marker URL.
    // Note: hooks are additive, so keep the condition tight.
    app.service("api/media").hooks({
      before: {
        create: [
          async (context) => {
            if (context.data?.url === failingUrl) {
              throw new Error("__vitest_forced_media_create_error");
            }
            return context;
          },
        ],
      },
    });

    await expect(
      app.service("api/records").create(
        {
          title: recordTitle,
          collection_id: 1000,
          media: [{ url: failingUrl, media_type: "" }],
        },
        params,
      ),
    ).rejects.toThrow(/__vitest_forced_media_create_error/);

    const recordsResult = await app.service("api/records").find({
      ...params,
      query: { title: recordTitle, $disable_pagination: true },
    });
    expect(Array.isArray(recordsResult)).toBe(true);
    expect(recordsResult.length).toBe(0);

    const mediaResult = await app.service("api/media").find({
      ...params,
      query: { url: failingUrl, $disable_pagination: true },
    });
    expect(Array.isArray(mediaResult)).toBe(true);
    expect(mediaResult.length).toBe(0);
  });
});
