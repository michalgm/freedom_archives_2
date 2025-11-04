/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function (knex) {
  await knex.raw(
    `   
CREATE VIEW
    records_snapshot_view AS(
        SELECT
            r.archive_id,
        r.record_id,
        r.title,
        r.description,
        r.vol_number,
        r.has_digital,
        r.date_modified,
        i.media_type AS media_type,
        r.primary_instance_format_text AS FORMAT,
        i.thumbnail AS thumbnail,
        i.call_number AS call_number,
        r.year,
        (
            SELECT
                    ARRAY_AGG(DISTINCT(VALUE ->> 'list_item_id'):: INTEGER)
                FROM
                    JSONB_ARRAY_ELEMENTS(r.subjects) AS VALUE
    ) AS subject_ids,
        (
            SELECT
                    ARRAY_AGG(DISTINCT(VALUE ->> 'list_item_id'):: INTEGER)
    FROM
    JSONB_ARRAY_ELEMENTS(r.authors) AS VALUE
            ) AS author_ids,
    (
        SELECT
                    ARRAY_AGG(DISTINCT(VALUE ->> 'list_item_id'):: INTEGER)
FROM
JSONB_ARRAY_ELEMENTS(r.keywords) AS VALUE
            ) AS keyword_ids,
    (
        SELECT
                    ARRAY_AGG(DISTINCT(VALUE ->> 'list_item_id'):: INTEGER)
FROM
JSONB_ARRAY_ELEMENTS(r.producers) AS VALUE) AS producer_ids,
        (
            SELECT
                    ARRAY_AGG(DISTINCT(VALUE ->> 'list_item_id'):: INTEGER)
                FROM
                    JSONB_ARRAY_ELEMENTS(r.publishers) AS VALUE
    ) AS publisher_ids,

        (r.program ->> 'list_item_id')::INTEGER AS program_id,
            r.collection_id,
            r.fulltext,
            r.search_text
FROM
            unified_records r
            JOIN collections c USING(collection_id)
            JOIN instances_view i ON r.primary_instance_id = i.instance_id
WHERE
r.is_hidden = FALSE AND
c.is_hidden = FALSE AND
r.needs_review = FALSE
    );

CREATE VIEW
    collections_snapshot_view AS(
    SELECT
            c.archive_id,
    c.collection_id,
    c.collection_name,
    c.description,
    c.summary,
    c.thumbnail,
    c.date_modified,
    c.parent_collection_id,
    c.search_text,
    c.fulltext,
    (
        SELECT
                    ARRAY_AGG(DISTINCT(VALUE ->> 'collection_id'):: INTEGER)
                FROM
                    UNNEST(c.children) AS VALUE
) AS collection_ids
FROM
            unified_collections c
WHERE
c.is_hidden = FALSE AND
c.needs_review = FALSE
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


CREATE SCHEMA public_search;

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

CREATE INDEX records_subject_ids_idx ON public_search.records USING GIN(subject_ids);

CREATE INDEX records_author_ids_idx ON public_search.records USING GIN(author_ids);

CREATE INDEX records_keyword_ids_idx ON public_search.records USING GIN(keyword_ids);

CREATE INDEX records_producer_ids_idx ON public_search.records USING GIN(producer_ids);

CREATE INDEX records_publisher_ids_idx ON public_search.records USING GIN(archive_id, publisher_ids);

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
ADD PRIMARY KEY(snapshot_id, archive_id, record_id);

CREATE TABLE
public_search.collections AS
SELECT
    *
    FROM
collections_snapshot_view
LIMIT
0;

ALTER TABLE public_search.collections
ADD PRIMARY KEY(archive_id, collection_id);


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

CREATE TABLE
public_search.featured_records(LIKE featured_records);

ALTER TABLE public_search.featured_records
ADD PRIMARY KEY(archive_id, record_id, collection_id);


CREATE TABLE
    featured_records_snapshots AS
SELECT
1 AS snapshot_id,
    *
    FROM
public_search.featured_records
LIMIT
0;

ALTER TABLE featured_records_snapshots
ADD PRIMARY KEY(snapshot_id, archive_id, record_id, collection_id);

CREATE TABLE
public_search.config(LIKE config);


CREATE TABLE
    config_snapshots AS
SELECT
1 AS snapshot_id,
    *
    FROM
public_search.config
LIMIT
0;

ALTER TABLE config_snapshots
ADD PRIMARY KEY(snapshot_id, archive_id, setting);


CREATE TABLE
public_search.list_items AS
SELECT
    *
    FROM
list_items
LIMIT
0;

ALTER TABLE public_search.list_items
ADD PRIMARY KEY(archive_id, "type", list_item_id);


CREATE TABLE
    list_items_snapshots AS
SELECT
1 AS snapshot_id,
    *
    FROM
public_search.list_items
LIMIT
0;

ALTER TABLE list_items_snapshots
ADD PRIMARY KEY(snapshot_id, archive_id, list_item_id);

CREATE TABLE
public_search.records_to_list_items AS
SELECT
1 AS archive_id,
    *
    FROM
records_to_list_items
LIMIT
0;

ALTER TABLE public_search.records_to_list_items
ADD PRIMARY KEY(archive_id, list_item_id, record_id);

CREATE UNIQUE INDEX records_to_list_items_idx ON public_search.records_to_list_items(archive_id, record_id, list_item_id);


CREATE TABLE
records_to_list_items_snapshots(
    snapshot_id INTEGER NOT NULL,
    archive_id INTEGER NOT NULL,
    list_item_id INTEGER NOT NULL,
    record_id INTEGER NOT NULL
);

ALTER TABLE records_to_list_items_snapshots
ADD PRIMARY KEY(snapshot_id, archive_id, list_item_id, record_id);

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

CREATE VIEW
    list_items_snapshot_view AS(
    SELECT DISTINCT
            r.archive_id,
    li.list_item_id,
    li.item,
    li.type,
    li.description
        FROM
            records_to_list_items_snapshot_view r
            JOIN list_items li USING(list_item_id)
);

CREATE TABLE
snapshots(
    snapshot_id serial PRIMARY KEY,
    archive_id INTEGER NOT NULL REFERENCES archives,
    title VARCHAR(100) NOT NULL DEFAULT '',
    date_published timestamptz DEFAULT NOW(),
    records_count INTEGER DEFAULT 0,
    collections_count INTEGER DEFAULT 0,
    max_record_date TIMESTAMPTZ,
    max_collection_date TIMESTAMPTZ,
    is_live BOOLEAN GENERATED ALWAYS AS(title = 'Public Data') STORED
);

CREATE INDEX snapshot_archive_idx ON "snapshots"(archive_id, snapshot_id);

ALTER TABLE records_snapshots
ADD CONSTRAINT fk_snapshot FOREIGN KEY(snapshot_id) REFERENCES snapshots(snapshot_id) ON DELETE CASCADE;

ALTER TABLE collections_snapshots
ADD CONSTRAINT fk_snapshot FOREIGN KEY(snapshot_id) REFERENCES snapshots(snapshot_id) ON DELETE CASCADE;

ALTER TABLE featured_records_snapshots
ADD CONSTRAINT fk_snapshot FOREIGN KEY(snapshot_id) REFERENCES snapshots(snapshot_id) ON DELETE CASCADE;

ALTER TABLE config_snapshots
ADD CONSTRAINT fk_snapshot FOREIGN KEY(snapshot_id) REFERENCES snapshots(snapshot_id) ON DELETE CASCADE;

ALTER TABLE list_items_snapshots
ADD CONSTRAINT fk_snapshot FOREIGN KEY(snapshot_id) REFERENCES snapshots(snapshot_id) ON DELETE CASCADE;

ALTER TABLE records_to_list_items_snapshots
ADD CONSTRAINT fk_snapshot FOREIGN KEY(snapshot_id) REFERENCES snapshots(snapshot_id) ON DELETE CASCADE;


        
        `
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function (knex) {
  await knex.schema.dropSchemaIfExists("public_search", true);

  await knex.schema.dropTableIfExists("records_snapshots");

  await knex.schema.dropTableIfExists("collections_snapshots");

  await knex.schema.dropTableIfExists("featured_records_snapshots");

  await knex.schema.dropTableIfExists("config_snapshots");

  await knex.schema.dropTableIfExists("public_search.list_items");

  await knex.schema.dropTableIfExists("list_items_snapshots");

  await knex.schema.dropTableIfExists("records_to_list_items_snapshots");

  await knex.schema.dropViewIfExists("public_search.records_view");

  await knex.schema.dropTableIfExists("snapshots", true);

  await knex.schema.dropViewIfExists("collections_snapshot_view", true);

  await knex.schema.dropViewIfExists("list_items_snapshot_view", true);
  await knex.schema.dropViewIfExists("records_to_list_items_snapshot_view", true);
  await knex.schema.dropViewIfExists("records_snapshot_view", true);
};
