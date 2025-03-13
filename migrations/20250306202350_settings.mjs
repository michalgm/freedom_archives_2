/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  await knex.schema.createTable("settings", (table) => {
    table.integer("archive_id").primary().references("archive_id").inTable("archives");
    table.jsonb("settings").defaultTo('""');
    table.primary(["archive_id", "setting"]);
  });
  await knex("settings").insert({
    archive_id: 1,
    settings: JSON.stringify({
      "featured_collection_id": "14",
      "site_intro_text": "<b>Welcome to the Freedom Archives' Digital Search Engine.</b><span>The Freedom Archives contains over 12,000 hours of audio and video recordings which date from the late-1960s to the mid-90s and chronicle the progressive history of the Bay Area, the United States, and international movements. We are also in the process of scanning and uploading thousands of historical documents which enrich our media holdings. Our collection includes weekly news, poetry, music programs; in-depth interviews and reports on social and cultural issues; numerous voices from behind prison walls; diverse activists; and pamphlets, journals and other materials from many radical organizations and movements.</span>"
    })
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
  await knex.schema.dropTable("settings");
};
