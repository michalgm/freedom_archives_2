
export const up = async function (knex) {


  await knex.schema.withSchema('freedom_archives').raw(/* sql */ `
ALTER TABLE collections_snapshots
ADD COLUMN display_order INTEGER;

ALTER TABLE freedom_archives.collections_snapshots
ADD CONSTRAINT fk_snapshot FOREIGN KEY (snapshot_id) REFERENCES freedom_archives.snapshots (snapshot_id) ON DELETE CASCADE NOT VALID;

ALTER TABLE freedom_archives.collections_snapshots VALIDATE CONSTRAINT fk_snapshot;

CREATE OR REPLACE VIEW
  collection_summaries AS
SELECT
  a.collection_id,
  a.title,
  a.parent_collection_id,
  a.summary,
  a.description,
  a.thumbnail,
  NULLIF(
    TRIM(
      BOTH
      FROM
        (COALESCE(call_numbers.item, ''::TEXT)||' '::TEXT)||COALESCE(a.call_number_suffix, ''::TEXT)
    ),
    ''::TEXT
  ) AS call_number,
  a.display_order,
  COALESCE(
    (
      SELECT
        ROW_TO_JSON(c.*) AS ROW_TO_JSON
      FROM
        (
          SELECT
            c_1.collection_id,
            c_1.title,
            c_1.thumbnail,
            c_1.parent_collection_id,
            TRIM(
              BOTH
              FROM
                (
                  COALESCE(parent_call_numbers.item, ''::TEXT)||' '::TEXT
                )||COALESCE(c_1.call_number_suffix, ''::TEXT)
            ) AS call_number
          FROM
            collections c_1
            LEFT JOIN list_items parent_call_numbers ON c_1.call_number_id=parent_call_numbers.list_item_id
            AND parent_call_numbers.type='call_number'::TEXT
          WHERE
            a.parent_collection_id=c_1.collection_id
        ) c
    ),
    '{}'::json
  ) AS parent,
  a.is_hidden
FROM
  collections a
  LEFT JOIN list_items call_numbers ON call_numbers.type='call_number'::TEXT
  AND a.call_number_id=call_numbers.list_item_id;

CREATE OR REPLACE VIEW
  collections_snapshot_view AS
SELECT
  archive_id,
  collection_id,
  title,
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
  children,
  display_order
FROM
  unified_collections c
WHERE
  is_hidden=FALSE
  AND needs_review=FALSE;
    `);

  await knex.schema.withSchema('public_search').raw(`
    ALTER TABLE public_search.collections ADD COLUMN display_order integer;
    `);
};


export const down = async function () {
}
