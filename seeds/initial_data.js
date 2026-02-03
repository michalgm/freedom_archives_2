/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("users").del();
  await knex("archives").del();
  await knex("archives").insert([{ archive_id: 1, title: "Test Archive" }]);
  await knex("collections").insert([
    { collection_id: 1000, archive_id: 1, title: "Unmanaged Collection" },
    { collection_id: 0, archive_id: 1, title: "Top Level Collection" },
  ]);
  await knex("records").insert([{ collection_id: 1000, archive_id: 1, title: "Test Record" }]);
};

export { seed };
