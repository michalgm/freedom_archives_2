
export const up = async function (knex) {
    

    await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
    await knex.raw(`
DROP VIEW IF EXISTS records_view CASCADE;

DROP VIEW IF EXISTS list_items_snapshot_view CASCADE;

DROP VIEW IF EXISTS records_to_list_items_snapshot_view CASCADE;

DROP VIEW IF EXISTS records_snapshot_view CASCADE;

DROP VIEW IF EXISTS collections_view CASCADE;

DROP VIEW IF EXISTS collections_snapshot_view CASCADE;

ALTER TABLE _unified_collections ADD COLUMN parent json;

ALTER TABLE _unified_collections ADD COLUMN children json[];

ALTER TABLE _unified_collections ADD COLUMN descendant_collection_ids integer[];

ALTER TABLE _unified_collections ADD COLUMN ancestors json[];

ALTER TABLE _unified_records ADD COLUMN primary_media_thumbnail text;

ALTER TABLE _unified_records ADD COLUMN primary_media_format_id integer;

ALTER TABLE _unified_records ADD COLUMN primary_media_format_text text;

ALTER TABLE _unified_records ADD COLUMN primary_media_media_type text;

ALTER TABLE _unified_records ADD COLUMN collection json;

ALTER TABLE _unified_records ADD COLUMN children json[];

ALTER TABLE _unified_records ADD COLUMN siblings json[];

ALTER TABLE _unified_records ADD COLUMN parent json;

ALTER TABLE _unified_records ADD COLUMN continuations json[];

CREATE OR REPLACE VIEW collections_list_items_view AS
 SELECT b.collection_id,
    a.type,
    array_to_json(array_agg(row_to_json(( SELECT i.*::record AS i
           FROM ( SELECT a.list_item_id,
                    a.item) i)) ORDER BY a.item))::jsonb AS items,
    string_agg(a.item, ' ## '::text ORDER BY a.item) AS items_text,
    array_agg(a.item ORDER BY a.item) AS items_search
   FROM list_items a
     JOIN collections_to_list_items b USING (list_item_id)
  GROUP BY b.collection_id, a.type;

CREATE OR REPLACE VIEW records_list_items_view AS
 SELECT b.record_id,
    a.type,
    array_to_json(array_agg(row_to_json(( SELECT i.*::record AS i
           FROM ( SELECT a.list_item_id,
                    a.item) i)) ORDER BY a.item))::jsonb AS items,
    string_agg(a.item, ' ## '::text ORDER BY a.item) AS items_text,
    array_agg(a.item ORDER BY a.item) AS items_search
   FROM list_items a
     JOIN records_to_list_items b USING (list_item_id)
  GROUP BY b.record_id, a.type;

CREATE OR REPLACE VIEW review_changes AS
 SELECT unified_records.record_id AS id,
    unified_records.collection_id,
    unified_records.title,
    'record'::text AS type,
        CASE
            WHEN unified_records.date_created = unified_records.date_modified THEN 'create'::text
            ELSE 'update'::text
        END AS action,
    COALESCE(unified_records.date_modified, unified_records.date_created) AS date_modified,
    unified_records.needs_review,
    unified_records.contributor_user_id,
    unified_records.contributor_name
   FROM _unified_records unified_records
  WHERE unified_records.date_modified IS NOT NULL
UNION
 SELECT unified_collections.collection_id AS id,
    unified_collections.collection_id,
    unified_collections.title,
    'collection'::text AS type,
        CASE
            WHEN unified_collections.date_created = unified_collections.date_modified THEN 'create'::text
            ELSE 'update'::text
        END AS action,
    COALESCE(unified_collections.date_modified, unified_collections.date_created) AS date_modified,
    unified_collections.needs_review,
    unified_collections.contributor_user_id,
    unified_collections.contributor_name
   FROM _unified_collections unified_collections
  WHERE unified_collections.date_modified IS NOT NULL;

CREATE OR REPLACE VIEW unified_collections AS
 SELECT a.collection_id,
    a.archive_id,
    a.parent_collection_id,
    a.title,
    a.description,
    a.description_search,
    a.summary,
    a.call_number_id,
    a.call_number_suffix,
    a.notes,
    a.thumbnail,
    a.display_order,
    a.date_range,
    a.needs_review,
    a.is_hidden,
    a.creator_user_id,
    a.contributor_user_id,
    a.date_created,
    a.date_modified,
    NULLIF(TRIM(BOTH FROM (COALESCE(call_numbers.item, ''::text) || ' '::text) || COALESCE(a.call_number_suffix, ''::text)), ''::text) AS call_number,
    (contributor.firstname || ' '::text) || contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    (creator.firstname || ' '::text) || creator.lastname AS creator_name,
    creator.username AS creator_username,
        CASE
            WHEN call_numbers.list_item_id IS NOT NULL THEN jsonb_build_object('item', call_numbers.item, 'list_item_id', call_numbers.list_item_id)
            ELSE NULL::jsonb
        END AS call_number_item,
    COALESCE(publishers.items, '[]'::jsonb) AS publishers,
    COALESCE(subjects.items, '[]'::jsonb) AS subjects,
    COALESCE(keywords.items, '[]'::jsonb) AS keywords,
    subjects.items_text AS subjects_text,
    keywords.items_text AS keywords_text,
    publishers.items_text AS publishers_text,
    subjects.items_search AS subjects_search,
    keywords.items_search AS keywords_search,
    publishers.items_search AS publishers_search,
    array_to_json(ARRAY( SELECT json_build_object('record_id', b_1.record_id, 'title', b_1.title, 'parent_record_id', b_1.parent_record_id, 'primary_media_thumbnail', primary_media.thumbnail, 'primary_media_format_id', primary_media.format_id, 'primary_media_format_text', list_items.item, 'primary_media_media_type', primary_media.media_type) AS json_build_object
           FROM records b_1
             LEFT JOIN media primary_media ON b_1.primary_media_id = primary_media.media_id
             LEFT JOIN list_items ON primary_media.format_id = list_items.list_item_id AND list_items.type = 'format'::text
          WHERE a.collection_id = b_1.collection_id
          ORDER BY b_1.title)) AS child_records,
    array_to_json(ARRAY( SELECT json_build_object('record_id', b_1.record_id, 'title', b_1.title, 'parent_record_id', b_1.parent_record_id, 'primary_media_thumbnail', primary_media.thumbnail, 'primary_media_format_id', primary_media.format_id, 'primary_media_format_text', list_items.item, 'primary_media_media_type', primary_media.media_type, 'primary_media_url', primary_media.url, 'label', f.label, 'record_order', f.record_order) AS json_build_object
           FROM records b_1
             LEFT JOIN featured_records f ON b_1.record_id = f.record_id
             LEFT JOIN media primary_media ON b_1.primary_media_id = primary_media.media_id
             LEFT JOIN list_items ON primary_media.format_id = list_items.list_item_id AND list_items.type = 'format'::text
          WHERE a.collection_id = f.collection_id
          ORDER BY f.record_order, b_1.title)) AS featured_records,
    ((((setweight(to_tsvector('english'::regconfig, COALESCE(a.title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig,
        CASE
            WHEN call_numbers.item IS NULL THEN ''::text
            ELSE TRIM(BOTH FROM (call_numbers.item || ' '::text) || COALESCE(a.call_number_suffix, ''::text))
        END), 'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(a.summary, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(a.description_search, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(keywords.items_text, ''::text)), 'C'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(subjects.items_text, ''::text)), 'C'::"char") AS fulltext,
    lower(regexp_replace(concat_ws(' ## '::text, NULLIF(a.title, ''::text), NULLIF(call_numbers.item, ''::text), NULLIF(a.call_number_suffix, ''::text), NULLIF(a.summary, ''::text), NULLIF(a.description_search, ''::text), NULLIF(keywords.items_text, ''::text), NULLIF(subjects.items_text, ''::text)), '\s+'::text, ' '::text, 'g'::text)) AS search_text,
    COALESCE(( SELECT row_to_json(p.*) AS row_to_json
           FROM collection_summaries p
          WHERE a.parent_collection_id = p.collection_id), '{}'::json) AS parent,
    ARRAY( SELECT row_to_json(collection_summaries.*) AS row_to_json
           FROM collection_summaries
          WHERE collection_summaries.parent_collection_id = a.collection_id
          ORDER BY collection_summaries.display_order) AS children,
    d.descendant_ids AS descendant_collection_ids,
    ancestors.ancestors
   FROM collections a
     LEFT JOIN collection_summaries b USING (collection_id)
     LEFT JOIN users contributor ON a.contributor_user_id = contributor.user_id
     LEFT JOIN users creator ON a.creator_user_id = creator.user_id
     LEFT JOIN collections_list_items_view subjects ON subjects.type = 'subject'::text AND subjects.collection_id = a.collection_id
     LEFT JOIN collections_list_items_view keywords ON keywords.type = 'keyword'::text AND keywords.collection_id = a.collection_id
     LEFT JOIN list_items call_numbers ON call_numbers.type = 'call_number'::text AND a.call_number_id = call_numbers.list_item_id
     LEFT JOIN collections_list_items_view publishers ON publishers.type = 'publisher'::text AND publishers.collection_id = a.collection_id
     LEFT JOIN LATERAL ( WITH RECURSIVE d AS (
                 SELECT collections.collection_id
                   FROM collections
                  WHERE collections.collection_id = a.collection_id
                UNION ALL
                 SELECT c.collection_id
                   FROM collections c
                     JOIN d d_2 ON c.parent_collection_id = d_2.collection_id
                )
         SELECT array_agg(d_1.collection_id ORDER BY d_1.collection_id) FILTER (WHERE d_1.collection_id <> a.collection_id) AS descendant_ids
           FROM d d_1) d ON true
     LEFT JOIN LATERAL ( WITH RECURSIVE ancestors_cte AS (
                 SELECT cs.collection_id,
                    cs.title,
                    cs.parent_collection_id,
                    1 AS level
                   FROM collection_summaries cs
                  WHERE cs.collection_id = a.parent_collection_id
                UNION ALL
                 SELECT cs.collection_id,
                    cs.title,
                    cs.parent_collection_id,
                    ac.level + 1
                   FROM collection_summaries cs
                     JOIN ancestors_cte ac ON cs.collection_id = ac.parent_collection_id
                )
         SELECT array_agg(json_build_object('collection_id', ancestors_cte.collection_id, 'title', ancestors_cte.title) ORDER BY ancestors_cte.level DESC) AS ancestors
           FROM ancestors_cte) ancestors ON true;

CREATE OR REPLACE VIEW unified_records AS
 SELECT a.record_id,
    a.archive_id,
    a.title,
    a.description,
    a.notes,
    a.location,
    a.vol_number,
    a.collection_id,
    a.parent_record_id,
    a.primary_media_id,
    a.year,
    a.month,
    a.day,
    a.year_is_circa,
    a.program_id,
    a.needs_review,
    a.is_hidden,
    a.creator_user_id,
    a.contributor_user_id,
    a.date_created,
    a.date_modified,
    (((COALESCE(lpad(a.month::text, 2, '0'::text), '00'::text) || '/'::text) || COALESCE(lpad(a.day::text, 2, '0'::text), '00'::text)) || '/'::text) || COALESCE(a.year::text, '0000'::text) AS date_string,
    ((((COALESCE(a.year::text, '1900'::text) || '-'::text) || COALESCE(a.month::text, '01'::text)) || '-'::text) || COALESCE(a.day::text, '01'::text))::date AS date,
        CASE
            WHEN program_lookup.list_item_id IS NOT NULL THEN jsonb_build_object('item', program_lookup.item, 'list_item_id', program_lookup.list_item_id)
            ELSE NULL::jsonb
        END AS program,
    COALESCE(media.media, '[]'::json) AS media,
    media.has_digital,
    COALESCE(media.media_count, 0::bigint) AS media_count,
    (contributor.firstname || ' '::text) || contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    (creator.firstname || ' '::text) || creator.lastname AS creator_name,
    creator.username AS creator_username,
    media.call_numbers,
    media.call_numbers_text,
    media.formats,
    media.qualitys,
    media.generations,
    media.media_types,
    COALESCE(authors.items, '[]'::jsonb) AS authors,
    COALESCE(publishers.items, '[]'::jsonb) AS publishers,
    COALESCE(subjects.items, '[]'::jsonb) AS subjects,
    COALESCE(keywords.items, '[]'::jsonb) AS keywords,
    COALESCE(producers.items, '[]'::jsonb) AS producers,
    authors.items_text AS authors_text,
    subjects.items_text AS subjects_text,
    keywords.items_text AS keywords_text,
    producers.items_text AS producers_text,
    publishers.items_text AS publishers_text,
    authors.items_search AS authors_search,
    subjects.items_search AS subjects_search,
    keywords.items_search AS keywords_search,
    producers.items_search AS producers_search,
    publishers.items_search AS publishers_search,
    ((((setweight(to_tsvector('english'::regconfig, COALESCE(a.title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(media.call_numbers_text, ''::text)), 'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(a.description, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(authors.items_text, ''::text)), 'C'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(subjects.items_text, ''::text)), 'C'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(keywords.items_text, ''::text)), 'C'::"char") AS fulltext,
    lower(regexp_replace(concat_ws(' ## '::text, NULLIF(a.title, ''::text), NULLIF(a.description, ''::text), NULLIF(media.call_numbers_text, ''::text), NULLIF(authors.items_text, ''::text), NULLIF(subjects.items_text, ''::text), NULLIF(keywords.items_text, ''::text)), '\s+'::text, ' '::text, 'g'::text)) AS search_text,
    b.primary_media_thumbnail,
    b.primary_media_format_id,
    b.primary_media_format_text,
    b.primary_media_media_type,
    b.collection,
    children.children,
    siblings.siblings,
    parent.parent,
    continuations.continuations
   FROM records a
     JOIN record_summaries b USING (record_id)
     LEFT JOIN list_items program_lookup ON a.program_id = program_lookup.list_item_id
     LEFT JOIN record_media_view media USING (record_id)
     LEFT JOIN media primary_media ON a.primary_media_id = primary_media.media_id
     LEFT JOIN users contributor ON a.contributor_user_id = contributor.user_id
     LEFT JOIN users creator ON a.creator_user_id = creator.user_id
     LEFT JOIN records_list_items_view authors ON authors.type = 'author'::text AND authors.record_id = a.record_id
     LEFT JOIN records_list_items_view subjects ON subjects.type = 'subject'::text AND subjects.record_id = a.record_id
     LEFT JOIN records_list_items_view keywords ON keywords.type = 'keyword'::text AND keywords.record_id = a.record_id
     LEFT JOIN records_list_items_view producers ON producers.type = 'producer'::text AND producers.record_id = a.record_id
     LEFT JOIN records_list_items_view publishers ON publishers.type = 'publisher'::text AND publishers.record_id = a.record_id
     LEFT JOIN record_summaries parent_record ON a.parent_record_id = parent_record.record_id
     LEFT JOIN LATERAL ( SELECT array_agg(row_to_json(record_summaries.*) ORDER BY record_summaries.title) AS children
           FROM record_summaries
          WHERE record_summaries.parent_record_id = a.record_id) children ON true
     LEFT JOIN LATERAL ( SELECT array_agg(row_to_json(record_summaries.*) ORDER BY record_summaries.title) AS siblings
           FROM record_summaries
          WHERE record_summaries.parent_record_id = a.parent_record_id AND record_summaries.record_id <> a.record_id) siblings ON true
     LEFT JOIN LATERAL ( SELECT COALESCE(array_agg(row_to_json(cr.*) ORDER BY (array_position(c.continuation_records, cr.record_id))), '{}'::json[]) AS continuations
           FROM continuations c,
            LATERAL unnest(c.continuation_records) WITH ORDINALITY rid(rid, ordinality)
             JOIN record_summaries cr ON rid.rid = cr.record_id
          WHERE a.record_id = ANY (c.continuation_records)) continuations ON true
     CROSS JOIN LATERAL ( SELECT COALESCE(row_to_json(parent_record.*), NULL::json) AS parent) parent;

CREATE OR REPLACE VIEW unified_search_view AS
 SELECT 'record'::text AS result_type,
    unified_records.record_id AS id,
    unified_records.title,
    unified_records.collection,
    unified_records.date_modified,
    unified_records.description,
    unified_records.search_text,
    unified_records.fulltext,
    unified_records.call_numbers,
    array_to_string(unified_records.call_numbers, ' '::text) AS call_number_text,
    unified_records.primary_media_media_type,
    unified_records.has_digital,
    NULL::text AS thumbnail
   FROM _unified_records unified_records
UNION ALL
 SELECT 'collection'::text AS result_type,
    unified_collections.collection_id AS id,
    unified_collections.title,
    unified_collections.parent AS collection,
    unified_collections.date_modified,
    unified_collections.description,
    unified_collections.search_text,
    unified_collections.fulltext,
        CASE
            WHEN unified_collections.call_number IS NOT NULL THEN ARRAY[unified_collections.call_number]
            ELSE ARRAY[]::text[]
        END AS call_numbers,
    unified_collections.call_number AS call_number_text,
    NULL::text AS primary_media_media_type,
    true AS has_digital,
    unified_collections.thumbnail
   FROM _unified_collections unified_collections;
    `);
    await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
    

    await knex.raw(`SET LOCAL search_path = 'public_search';`);
    await knex.raw(`

    `);
    await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
    
};
  
export const down = async function (knex) {
};
  
