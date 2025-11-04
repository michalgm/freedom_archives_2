
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  await knex.schema.dropViewIfExists('collections_snapshot_view');
  await knex.schema.raw(`
CREATE VIEW
    collections_snapshot_view AS
SELECT
    archive_id,
    collection_id,
    collection_name,
    description,
    summary,
    thumbnail,
    date_modified,
    parent_collection_id,
    descendant_collection_ids,
    featured_records,
    keywords,
    date_range,
    ancestors,
    children
FROM
    unified_collections c
WHERE
    is_hidden=FALSE
    AND needs_review=FALSE;
  `);
  await knex.schema.withSchema('public_search').dropViewIfExists('records_view');
  await knex.schema.withSchema('public_search').dropTableIfExists('collections');
  await knex.schema.raw(`
CREATE TABLE public_search.collections AS
SELECT
    *
FROM
    collections_snapshot_view;
`);
  await knex.schema.withSchema('public_search').alterTable('collections', (table) => {
    table.primary(['archive_id', 'collection_id']);
  });
  await knex.schema.dropTableIfExists('collections_snapshots');
  await knex.schema.raw(`
CREATE TABLE
    collections_snapshots AS
    SELECT
    1 AS snapshot_id,
    *
        FROM
    public_search.collections
    LIMIT
    0;

ALTER TABLE collections_snapshots
ADD PRIMARY KEY(snapshot_id, archive_id, collection_id);



CREATE VIEW
  public_search.records_view AS
SELECT
  r.*,
  collection_name,
  JSON_BUILD_OBJECT(
    'item',
    programs.item,
    'id',
    programs.list_item_id
  ) AS PROGRAM,
  (
    SELECT
      JSON_AGG(
        JSON_BUILD_OBJECT('item', item, 'id', list_item_id)
      )
    FROM
      public_search.list_items
    WHERE
      list_item_id=ANY (r.publisher_ids)
  ) AS publishers,
  (
    SELECT
      JSON_AGG(
        JSON_BUILD_OBJECT('item', item, 'id', list_item_id)
      )
    FROM
      public_search.list_items
    WHERE
      list_item_id=ANY (r.producer_ids)
  ) AS producers,
  (
    SELECT
      JSON_AGG(
        JSON_BUILD_OBJECT('item', item, 'id', list_item_id)
      )
    FROM
      public_search.list_items
    WHERE
      list_item_id=ANY (r.author_ids)
  ) AS authors
FROM
  public_search.records r
  JOIN public_search.collections USING (collection_id)
  LEFT JOIN public_search.list_items programs ON r.program_id=programs.list_item_id
  AND programs.type='program';
`);

  //     await knex.schema.withSchema('public_search').raw(`
  //         CREATE VIEW collections_view AS
  //          SELECT r.archive_id,
  //     r.record_id,
  //     r.title,
  //     r.description,
  //     r.vol_number,
  //     r.has_digital,
  //     r.date_modified,
  //     r.date,
  //     r.media_type,
  //     r.format,
  //     r.url,
  //     r.thumbnail,
  //     r.call_number,
  //     r.year,
  //     r.subject_ids,
  //     r.author_ids,
  //     r.keyword_ids,
  //     r.producer_ids,
  //     r.publisher_id,
  //     r.program_id,
  //     r.collection_id,
  //     r.fulltext,
  //     r.search_text,
  //     collections.collection_name,
  //     json_build_object('item', programs.item, 'id', programs.list_item_id) AS program,
  //     json_build_object('item', publishers.item, 'id', publishers.list_item_id) AS publisher,
  //     ( SELECT json_agg(json_build_object('item', list_items.item, 'id', list_items.list_item_id)) AS json_agg
  //            FROM public_search.list_items
  //           WHERE list_items.list_item_id = ANY (r.producer_ids)) AS producers,
  //     ( SELECT json_agg(json_build_object('item', list_items.item, 'id', list_items.list_item_id)) AS json_agg
  //            FROM public_search.list_items
  //           WHERE list_items.list_item_id = ANY (r.author_ids)) AS authors
  //    FROM public_search.records r
  //      JOIN public_search.collections USING (collection_id)
  //      LEFT JOIN public_search.list_items programs ON r.program_id = programs.list_item_id AND programs.type = 'program'::text
  //      LEFT JOIN public_search.list_items publishers ON r.publisher_id = publishers.list_item_id AND publishers.type = 'publisher'::text;
  //     `);

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async () => {

};
