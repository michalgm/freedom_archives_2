
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {

  return knex.raw(`
DROP VIEW IF EXISTS list_items_snapshot_view;

DROP VIEW IF EXISTS records_to_list_items_snapshot_view;

DROP VIEW IF EXISTS records_snapshot_view;

DROP VIEW IF EXISTS public_search.records_view;

DROP TABLE IF EXISTS public_search.records;
DROP TABLE IF EXISTS records_snapshots;

CREATE VIEW
    records_snapshot_view AS (
        SELECT
            r.archive_id,
            r.record_id,
            r.title,
            r.description,
            r.vol_number,
            r.has_digital,
            r.date_modified,
            r.date,
            i.media_type AS media_type,
            r.primary_instance_format_text AS FORMAT,
            i.url AS url,
            i.thumbnail AS thumbnail,
            i.call_number AS call_number,
            r.year,
            (
                SELECT
                    ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
                FROM
                    JSONB_ARRAY_ELEMENTS(r.subjects) AS VALUE
            ) AS subject_ids,
            (
                SELECT
                    ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
                FROM
                    JSONB_ARRAY_ELEMENTS(r.authors) AS VALUE
            ) AS author_ids,
            (
                SELECT
                    ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
                FROM
                    JSONB_ARRAY_ELEMENTS(r.keywords) AS VALUE
            ) AS keyword_ids,
            (
                SELECT
                    ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
                FROM
                    JSONB_ARRAY_ELEMENTS(r.producers) AS VALUE
            ) AS producer_ids,
            (
                SELECT
                    ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
                FROM
                    JSONB_ARRAY_ELEMENTS(r.publishers) AS VALUE
            ) AS publisher_ids,
            (r.program->>'list_item_id')::INTEGER AS program_id,
            r.collection_id,
            r.fulltext,
            r.search_text
        FROM
            unified_records r
            JOIN collections c USING (collection_id)
            JOIN instances_view i ON r.primary_instance_id=i.instance_id
        WHERE
            r.is_hidden=FALSE
            AND c.is_hidden=FALSE
            AND r.needs_review=FALSE
    );


CREATE VIEW
    records_to_list_items_snapshot_view AS(
    SELECT
            r.archive_id,
    l.list_item_id,
    r.record_id
        FROM
            records_snapshot_view r
            JOIN records_to_list_items l USING(record_id)
        UNION
        SELECT DISTINCT
            r.archive_id,
    l.list_item_id,
    r.record_id
        FROM
            instances i
            JOIN instances_to_list_items l USING(instance_id)
            JOIN records_snapshot_view r USING(record_id)
);


CREATE VIEW
    list_items_snapshot_view AS (
        SELECT DISTINCT
            li.list_item_id,
            r.archive_id,
            li.item,
            li.fulltext,
            li.search_text,
            li.type,
            li.description
        FROM
            records_to_list_items_snapshot_view r
            JOIN list_items li USING (list_item_id)
    );

DROP TABLE IF EXISTS public_search.records;

CREATE TABLE
public_search.records AS
SELECT
    *
    FROM
records_snapshot_view
LIMIT
0;

ALTER TABLE public_search.records
ADD PRIMARY KEY(archive_id, record_id);

CREATE INDEX records_date_idx ON public_search.records(date);

CREATE INDEX records_subject_ids_idx ON public_search.records USING GIN(subject_ids);

CREATE INDEX records_author_ids_idx ON public_search.records USING GIN(author_ids);

CREATE INDEX records_keyword_ids_idx ON public_search.records USING GIN(keyword_ids);

CREATE INDEX records_producer_ids_idx ON public_search.records USING GIN(producer_ids);

CREATE INDEX records_publisher_ids_idx ON public_search.records USING GIN(publisher_ids);

CREATE INDEX records_program_id_idx ON public_search.records(archive_id, program_id);

CREATE INDEX records_collection_id_idx ON public_search.records(archive_id, collection_id);

CREATE INDEX records_year_idx ON public_search.records(archive_id, "year");

CREATE INDEX records_fulltext_idx ON public_search.records USING GIN(fulltext);

CREATE INDEX records_has_digital_idx ON public_search.records(archive_id, has_digital);

CREATE INDEX records_format_idx ON public_search.records(archive_id, "format");

CREATE INDEX records_media_type_idx ON public_search.records(archive_id, media_type);

create index records_search_text_idx on public_search.records using GIN (search_text gin_trgm_ops);


CREATE TABLE
    records_snapshots AS
SELECT
1 AS snapshot_id,
    *
    FROM
public_search.records
LIMIT
0;

ALTER TABLE records_snapshots
ADD CONSTRAINT fk_snapshot FOREIGN KEY(snapshot_id) REFERENCES snapshots(snapshot_id) ON DELETE CASCADE;

ALTER TABLE records_snapshots
ADD PRIMARY KEY (snapshot_id, archive_id, record_id);


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
  ) as publishers,
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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {

};
