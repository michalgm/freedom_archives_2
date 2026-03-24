export async function truncateAllTables(db) {
  // Get all table names except migrations
  const tables = await db('information_schema.tables')
    .select('table_name')
    .where('table_schema', 'public')
    .whereNotIn('table_name', ['knex_migrations', 'knex_migrations_lock']);

  // Disable foreign key checks temporarily
  await db.raw('SET CONSTRAINTS ALL DEFERRED');

  // Truncate all tables
  for (const { table_name } of tables) {
    await db.raw(`TRUNCATE TABLE "${table_name}" CASCADE`);
  }

  // Re-enable foreign key checks
  await db.raw('SET CONSTRAINTS ALL IMMEDIATE');
}
