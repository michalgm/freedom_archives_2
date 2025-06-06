DROP VIEW IF EXISTS instances_view;

CREATE VIEW
    instances_view AS
SELECT
    a.*,
    NULLIF(
        TRIM(
            COALESCE(call_number_lookup.item, '')||' '||COALESCE(a.call_number_suffix, '')
        ),
        ''
    ) AS call_number,
    CASE
        WHEN call_number_lookup.list_item_id IS NOT NULL THEN JSONB_BUILD_OBJECT(
            'item',
            call_number_lookup.item,
            'list_item_id',
            call_number_lookup.list_item_id
        )
        ELSE NULL
    END AS call_number_item,
    CASE
        WHEN format_lookup.list_item_id IS NOT NULL THEN JSONB_BUILD_OBJECT(
            'item',
            format_lookup.item,
            'list_item_id',
            format_lookup.list_item_id
        )
        ELSE NULL
    END AS format_item,
    CASE
        WHEN quality_lookup.list_item_id IS NOT NULL THEN JSONB_BUILD_OBJECT(
            'item',
            quality_lookup.item,
            'list_item_id',
            quality_lookup.list_item_id
        )
        ELSE NULL
    END AS quality_item,
    CASE
        WHEN generation_lookup.list_item_id IS NOT NULL THEN JSONB_BUILD_OBJECT(
            'item',
            generation_lookup.item,
            'list_item_id',
            generation_lookup.list_item_id
        )
        ELSE NULL
    END AS generation_item,
    contributor.firstname||' '||contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    creator.firstname||' '||creator.lastname AS creator_name,
    creator.username AS creator_username,
    (primary_record.record_id IS NOT NULL) AS is_primary
FROM
    instances a
    LEFT JOIN list_items call_number_lookup ON call_number_id=call_number_lookup.list_item_id
    LEFT JOIN list_items format_lookup ON format_id=format_lookup.list_item_id
    LEFT JOIN list_items quality_lookup ON quality_id=quality_lookup.list_item_id
    LEFT JOIN list_items generation_lookup ON generation_id=generation_lookup.list_item_id
    LEFT JOIN users contributor ON a.contributor_user_id=contributor.user_id
    LEFT JOIN users creator ON a.creator_user_id=creator.user_id
    LEFT JOIN records primary_record ON a.instance_id=primary_record.primary_instance_id;

DROP VIEW IF EXISTS records_list_items_view;

CREATE VIEW
    records_list_items_view AS
SELECT
    b.record_id,
    a.type,
    ARRAY_TO_JSON(
        ARRAY_AGG(
            ROW_TO_JSON(
                (
                    SELECT
                        i
                    FROM
                        (
                            SELECT
                                a.list_item_id,
                                a.item
                        ) i
                )
            )
            ORDER BY
                item
        )
    )::jsonb AS items,
    STRING_AGG(
        a.item,
        ' '
        ORDER BY
            a.item
    ) AS items_text,
    ARRAY_AGG(
        a.item
        ORDER BY
            a.item
    ) AS items_search
FROM
    list_items a
    JOIN records_to_list_items b USING (list_item_id)
GROUP BY
    b.record_id,
    a.type;

DROP VIEW IF EXISTS collections_list_items_view;

CREATE VIEW
    collections_list_items_view AS
SELECT
    b.collection_id,
    a.type,
    ARRAY_TO_JSON(
        ARRAY_AGG(
            ROW_TO_JSON(
                (
                    SELECT
                        i
                    FROM
                        (
                            SELECT
                                a.list_item_id,
                                a.item
                        ) i
                )
            )
            ORDER BY
                item
        )
    )::jsonb AS items,
    STRING_AGG(
        a.item,
        ' '
        ORDER BY
            a.item
    ) AS items_text,
    ARRAY_AGG(
        a.item
        ORDER BY
            a.item
    ) AS items_search
FROM
    list_items a
    JOIN collections_to_list_items b USING (list_item_id)
GROUP BY
    b.collection_id,
    a.type;

DROP VIEW IF EXISTS collection_summaries;

CREATE VIEW
    collection_summaries AS
SELECT
    a.collection_id,
    a.collection_name,
    a.parent_collection_id,
    a.thumbnail,
    NULLIF(
        TRIM(
            COALESCE(call_numbers.item, '')||' '||COALESCE(a.call_number_suffix, '')
        ),
        ''
    ) AS call_number,
    a.display_order,
    COALESCE(
        (
            SELECT
                ROW_TO_JSON(c)
            FROM
                (
                    SELECT
                        collection_id,
                        collection_name,
                        thumbnail,
                        parent_collection_id,
                        TRIM(
                            COALESCE(parent_call_numbers.item, '')||' '||COALESCE(c.call_number_suffix, '')
                        ) AS call_number
                    FROM
                        collections c
                        LEFT JOIN list_items parent_call_numbers ON c.call_number_id=parent_call_numbers.list_item_id
                        AND parent_call_numbers.type='call_number'
                    WHERE
                        a.parent_collection_id=c.collection_id
                ) c
        ),
        '{}'
    ) AS parent
FROM
    collections a
    LEFT JOIN list_items call_numbers ON call_numbers.type='call_number'
    AND a.call_number_id=call_numbers.list_item_id;

DROP VIEW IF EXISTS collections_view;

CREATE VIEW
    collections_view AS
SELECT
    a.*,
    NULLIF(
        TRIM(
            COALESCE(call_numbers.item, '')||' '||COALESCE(a.call_number_suffix, '')
        ),
        ''
    ) AS call_number,
    contributor.firstname||' '||contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    creator.firstname||' '||creator.lastname AS creator_name,
    creator.username AS creator_username,
    CASE
        WHEN call_numbers.list_item_id IS NOT NULL THEN JSONB_BUILD_OBJECT(
            'item',
            call_numbers.item,
            'list_item_id',
            call_numbers.list_item_id
        )
        ELSE NULL
    END AS call_number_item,
    CASE
        WHEN publisher_lookup.list_item_id IS NOT NULL THEN JSONB_BUILD_OBJECT(
            'item',
            publisher_lookup.item,
            'list_item_id',
            publisher_lookup.list_item_id
        )
        ELSE NULL
    END AS publisher,
    COALESCE(subjects.items, '[]') AS subjects,
    COALESCE(keywords.items, '[]') AS keywords,
    subjects.items_text AS subjects_text,
    keywords.items_text AS keywords_text,
    publisher_lookup.item AS publisher_text,
    subjects.items_search AS subjects_search,
    keywords.items_search AS keywords_search,
    ARRAY_TO_JSON(
        ARRAY (
            SELECT
                JSON_BUILD_OBJECT(
                    'record_id',
                    b.record_id,
                    'title',
                    b.title,
                    'parent_record_id',
                    b.parent_record_id,
                    'primary_instance_thumbnail',
                    primary_instance.thumbnail,
                    'primary_instance_format_id',
                    primary_instance.format_id,
                    'primary_instance_format_text',
                    list_items.item,
                    'primary_instance_media_type',
                    primary_instance.media_type
                )
            FROM
                records b
                LEFT JOIN instances primary_instance ON b.primary_instance_id=primary_instance.instance_id
                LEFT JOIN list_items ON primary_instance.format_id=list_items.list_item_id
                AND list_items.type='format'
            WHERE
                a.collection_id=b.collection_id
            ORDER BY
                b.title
        )
    ) AS child_records,
    ARRAY_TO_JSON(
        ARRAY (
            SELECT
                JSON_BUILD_OBJECT(
                    'record_id',
                    b.record_id,
                    'title',
                    b.title,
                    'parent_record_id',
                    b.parent_record_id,
                    'primary_instance_thumbnail',
                    primary_instance.thumbnail,
                    'primary_instance_format_id',
                    primary_instance.format_id,
                    'primary_instance_format_text',
                    list_items.item,
                    'primary_instance_media_type',
                    primary_instance.media_type,
                    'label',
                    f.label,
                    'record_order',
                    f.record_order
                )
            FROM
                records b
                LEFT JOIN featured_records f ON b.record_id=f.record_id
                LEFT JOIN instances primary_instance ON b.primary_instance_id=primary_instance.instance_id
                LEFT JOIN list_items ON primary_instance.format_id=list_items.list_item_id
                AND list_items.type='format'
            WHERE
                a.collection_id=f.collection_id
            ORDER BY
                f.record_order,
                b.title
        )
    ) AS featured_records,
    SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(a.collection_name, '')),
        'A'
    )||SETWEIGHT(
        TO_TSVECTOR(
            'english',
            CASE
                WHEN call_numbers.item IS NULL THEN ''
                ELSE TRIM(
                    call_numbers.item||' '||COALESCE(a.call_number_suffix, '')
                )
            END
        ),
        'A'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(a.summary, '')),
        'B'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(a.description_search, '')),
        'B'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(keywords.items_text, '')),
        'C'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(subjects.items_text, '')),
        'C'
    ) AS fulltext,
    LOWER(
        COALESCE(a.collection_name, '')||' '||COALESCE(call_numbers.item, '')||' '||COALESCE(a.call_number_suffix, '')||' '||COALESCE(a.summary, '')||' '||COALESCE(a.description_search, '')||' '||COALESCE(keywords.items_text, '')||' '||COALESCE(subjects.items_text, '')
    ) AS search_text
FROM
    collections a
    LEFT JOIN list_items publisher_lookup ON a.publisher_id=publisher_lookup.list_item_id
    LEFT JOIN users contributor ON a.contributor_user_id=contributor.user_id
    LEFT JOIN users creator ON a.creator_user_id=creator.user_id
    LEFT JOIN collections_list_items_view subjects ON subjects.type='subject'
    AND subjects.collection_id=a.collection_id
    LEFT JOIN collections_list_items_view keywords ON keywords.type='keyword'
    AND keywords.collection_id=a.collection_id
    LEFT JOIN list_items call_numbers ON call_numbers.type='call_number'
    AND a.call_number_id=call_numbers.list_item_id;

DROP TABLE IF EXISTS _unified_collections CASCADE;

CREATE TABLE
    _unified_collections AS
SELECT
    *
FROM
    collections_view;

CREATE INDEX collections_fulltext_index ON _unified_collections USING GIN (fulltext);

CREATE INDEX collections_search_text_index ON _unified_collections USING GIN (search_text gin_trgm_ops);

CREATE INDEX collections_publisher_index ON _unified_collections (publisher_text);

CREATE INDEX collections_subjects_index ON _unified_collections USING GIN (subjects_search);

CREATE INDEX collections_keywords_index ON _unified_collections USING GIN (keywords_search);

CREATE INDEX collections_summary_index ON _unified_collections (summary);

CREATE INDEX collections_description_index ON _unified_collections USING GIN (description_search gin_trgm_ops);

CREATE INDEX collections_collection_name_index ON _unified_collections (collection_name);

CREATE INDEX collections_call_number_index ON _unified_collections (call_number);

ALTER TABLE _unified_collections
ADD PRIMARY KEY (collection_id);

CREATE OR REPLACE VIEW
    unified_collections AS
SELECT
    a.*,
    COALESCE(
        (
            SELECT
                ROW_TO_JSON(p)
            FROM
                collection_summaries p
            WHERE
                a.parent_collection_id=p.collection_id
        ),
        '{}'
    ) AS parent,
    ARRAY (
        SELECT
            ROW_TO_JSON(collection_summaries)
        FROM
            collection_summaries
        WHERE
            collection_summaries.parent_collection_id=a.collection_id
        ORDER BY
            collection_summaries.display_order
    ) AS children,
    d.descendant_ids AS descendant_collection_ids
FROM
    _unified_collections a
    LEFT JOIN collection_summaries b USING (collection_id)
    LEFT JOIN LATERAL (
        WITH RECURSIVE
            d AS (
                SELECT
                    collection_id
                FROM
                    collections
                WHERE
                    collection_id=a.collection_id
                UNION ALL
                SELECT
                    c.collection_id
                FROM
                    collections c
                    JOIN d ON c.parent_collection_id=d.collection_id
            )
        SELECT
            ARRAY_AGG(
                d.collection_id
                ORDER BY
                    d.collection_id
            ) FILTER (
                WHERE
                    d.collection_id<>a.collection_id
            ) AS descendant_ids
        FROM
            d
    ) AS d ON TRUE;

DROP VIEW IF EXISTS record_summaries;

CREATE VIEW
    record_summaries AS
SELECT
    a.record_id,
    a.title,
    a.parent_record_id,
    primary_instance.thumbnail AS primary_instance_thumbnail,
    primary_instance.format_id AS primary_instance_format_id,
    list_items.item AS primary_instance_format_text,
    primary_instance.media_type AS primary_instance_media_type,
    COALESCE(
        (
            SELECT
                ROW_TO_JSON(c)
            FROM
                collection_summaries c
            WHERE
                a.collection_id=c.collection_id
        ),
        '{}'
    ) AS collection
FROM
    records a
    LEFT JOIN instances primary_instance ON a.primary_instance_id=primary_instance.instance_id
    LEFT JOIN list_items ON primary_instance.format_id=list_items.list_item_id
    AND list_items.type='format';

/* FIXME collection */
DROP VIEW IF EXISTS record_instances_view;

CREATE VIEW
    record_instances_view AS
SELECT
    record_id,
    BOOL_OR(url!='') AS has_digital,
    COUNT(*) AS instance_count,
    ARRAY_TO_JSON(
        ARRAY_AGG(
            ROW_TO_JSON(a)
            ORDER BY
                a.is_primary DESC,
                a.instance_id
        )
    ) AS instances,
    ARRAY_AGG(DISTINCT call_number) FILTER (
        WHERE
            call_number IS NOT NULL
    ) AS call_numbers,
    STRING_AGG(DISTINCT call_number, ' ') FILTER (
        WHERE
            call_number IS NOT NULL
    ) AS call_numbers_text,
    ARRAY_AGG(DISTINCT format_id) FILTER (
        WHERE
            format_id IS NOT NULL
    ) AS formats,
    ARRAY_AGG(DISTINCT quality_id) FILTER (
        WHERE
            quality_id IS NOT NULL
    ) AS qualitys,
    ARRAY_AGG(DISTINCT generation_id) FILTER (
        WHERE
            generation_id IS NOT NULL
    ) AS generations,
    ARRAY_AGG(DISTINCT media_type) FILTER (
        WHERE
            media_type IS NOT NULL
    ) AS media_types
FROM
    instances_view a
GROUP BY
    record_id;

DROP VIEW IF EXISTS records_view;

CREATE VIEW
    records_view AS
SELECT
    a.*,
    -- b.primary_instance_thumbnail,
    -- b.primary_instance_format,
    -- b.primary_instance_format_text,
    -- b.primary_instance_media_type,
    -- b.collection,
    COALESCE(LPAD(a.month::TEXT, 2, '0'), '00')||'/'||COALESCE(LPAD(a.day::TEXT, 2, '0'), '00')||'/'||COALESCE(a.year::TEXT, '0000') AS date_string,
    (
        COALESCE(a.year::TEXT, '1900')::TEXT||'-'||COALESCE(a.month::TEXT, '01')::TEXT||'-'||COALESCE(a.day::TEXT, '01')::TEXT
    )::date AS date,
    CASE
        WHEN publisher_lookup.list_item_id IS NOT NULL THEN JSONB_BUILD_OBJECT(
            'item',
            publisher_lookup.item,
            'list_item_id',
            publisher_lookup.list_item_id
        )
        ELSE NULL
    END AS publisher,
    CASE
        WHEN program_lookup.list_item_id IS NOT NULL THEN JSONB_BUILD_OBJECT(
            'item',
            program_lookup.item,
            'list_item_id',
            program_lookup.list_item_id
        )
        ELSE NULL
    END AS PROGRAM,
    COALESCE(instances.instances, '[]') AS instances,
    instances.has_digital AS has_digital,
    COALESCE(instances.instance_count, 0) AS instance_count,
    contributor.firstname||' '||contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    creator.firstname||' '||creator.lastname AS creator_name,
    creator.username AS creator_username,
    instances.call_numbers,
    instances.call_numbers_text,
    instances.formats,
    instances.qualitys,
    instances.generations,
    instances.media_types,
    COALESCE(authors.items, '[]') AS authors,
    COALESCE(subjects.items, '[]') AS subjects,
    COALESCE(keywords.items, '[]') AS keywords,
    COALESCE(producers.items, '[]') AS producers,
    authors.items_text AS authors_text,
    subjects.items_text AS subjects_text,
    keywords.items_text AS keywords_text,
    producers.items_text AS producers_text,
    authors.items_search AS authors_search,
    subjects.items_search AS subjects_search,
    keywords.items_search AS keywords_search,
    producers.items_search AS producers_search,
    SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(a.title, '')),
        'A'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(instances.call_numbers_text)),
        'A'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(a.description, '')),
        'B'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(authors.items_text, '')),
        'C'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(subjects.items_text, '')),
        'C'
    )||SETWEIGHT(
        TO_TSVECTOR('english', COALESCE(keywords.items_text, '')),
        'C'
    ) AS fulltext,
    LOWER(
        COALESCE(a.title, '')||' '||COALESCE(instances.call_numbers_text, '')||' '||COALESCE(a.description, '')||' '||COALESCE(instances.call_numbers_text, '')||' '||COALESCE(authors.items_text, '')||' '||COALESCE(subjects.items_text, '')||' '||COALESCE(keywords.items_text, '')
    ) AS search_text
FROM
    records a -- left join record_summaries b using (record_id)
    -- left join record_summaries parent on a.parent_record_id = parent.record_id
    LEFT JOIN list_items publisher_lookup ON a.publisher_id=publisher_lookup.list_item_id
    LEFT JOIN list_items program_lookup ON a.program_id=program_lookup.list_item_id
    LEFT JOIN record_instances_view instances USING (record_id)
    LEFT JOIN instances primary_instance ON a.primary_instance_id=primary_instance.instance_id
    LEFT JOIN users contributor ON a.contributor_user_id=contributor.user_id
    LEFT JOIN users creator ON a.creator_user_id=creator.user_id -- left join (select parent_record_id, array_to_json(array_agg(row_to_json(b))) as children from (select parent_record_id, record_id, title from records) b group by parent_record_id) children on children.parent_record_id = a.record_id
    -- left join
    --   (select parent_record_id,
    --           array_to_json(array_agg(row_to_json(b))) as siblings
    --    from
    --      (select parent_record_id,
    --              record_id,
    --              title
    --       from records) b
    --    group by parent_record_id) siblings on siblings.parent_record_id = a.parent_record_id
    LEFT JOIN records_list_items_view authors ON authors.type='author'
    AND authors.record_id=a.record_id
    LEFT JOIN records_list_items_view subjects ON subjects.type='subject'
    AND subjects.record_id=a.record_id
    LEFT JOIN records_list_items_view keywords ON keywords.type='keyword'
    AND keywords.record_id=a.record_id
    LEFT JOIN records_list_items_view producers ON producers.type='producer'
    AND producers.record_id=a.record_id
    -- left join records parent on a.parent_record_id = parent.record_id
;

ANALYZE records;

ANALYZE list_items;

ANALYZE instances;

DROP TABLE IF EXISTS _unified_records CASCADE;

CREATE TABLE
    _unified_records AS
SELECT
    *
FROM
    records_view;

CREATE INDEX records_fulltext_index ON _unified_records USING GIN (fulltext);

CREATE INDEX records_search_text_index ON _unified_records USING GIN (search_text gin_trgm_ops);

CREATE INDEX records_year ON _unified_records (YEAR);

CREATE INDEX records_title ON _unified_records (title);

CREATE INDEX records_has_digital ON _unified_records (has_digital);

CREATE INDEX records_collection_id ON _unified_records (collection_id);

-- CREATE INDEX records_keywords_text on _unified_records (keywords_text);
-- CREATE INDEX records_subjects_text on _unified_records (subjects_text);
-- CREATE INDEX records_authors_text on _unified_records (authors_text);
-- CREATE INDEX records_producers_text on _unified_records (producers_text);
CREATE INDEX records_parent_record_id ON _unified_records (parent_record_id);

CREATE INDEX records_call_numbers ON _unified_records USING GIN (call_numbers);

CREATE INDEX records_authors_search ON _unified_records USING GIN (authors_search);

CREATE INDEX records_subjects_search ON _unified_records USING GIN (subjects_search);

CREATE INDEX records_keywords_search ON _unified_records USING GIN (keywords_search);

CREATE INDEX records_producers_search ON _unified_records USING GIN (producers_search);

ALTER TABLE _unified_records
ADD PRIMARY KEY (record_id);

CREATE OR REPLACE VIEW
    unified_records AS
SELECT
    a.*,
    b.primary_instance_thumbnail,
    b.primary_instance_format_id,
    b.primary_instance_format_text,
    b.primary_instance_media_type,
    b.collection,
    children.children,
    siblings.siblings,
    parent.parent,
    continuations.continuations
FROM
    _unified_records a
    JOIN record_summaries b USING (record_id)
    -- Parent record (simple LEFT JOIN)
    LEFT JOIN record_summaries parent_record ON a.parent_record_id=parent_record.record_id
    -- Children records (LATERAL join for aggregation)
    LEFT JOIN LATERAL (
        SELECT
            ARRAY_AGG(
                ROW_TO_JSON(record_summaries)
                ORDER BY
                    record_summaries.title
            ) AS children
        FROM
            record_summaries
        WHERE
            record_summaries.parent_record_id=a.record_id
    ) children ON TRUE
    -- Siblings records (LATERAL join for aggregation)  
    LEFT JOIN LATERAL (
        SELECT
            ARRAY_AGG(
                ROW_TO_JSON(record_summaries)
                ORDER BY
                    record_summaries.title
            ) AS siblings
        FROM
            record_summaries
        WHERE
            record_summaries.parent_record_id=a.parent_record_id
            AND record_summaries.record_id!=a.record_id
    ) siblings ON TRUE
    -- Continuations (LATERAL join for complex logic)
    LEFT JOIN LATERAL (
        SELECT
            COALESCE(
                ARRAY_AGG(
                    ROW_TO_JSON(cr)
                    ORDER BY
                        ARRAY_POSITION(c.continuation_records, cr.record_id)
                ),
                '{}'
            ) AS continuations
        FROM
            continuations c,
            UNNEST(c.continuation_records)
        WITH
            ORDINALITY rid
            JOIN record_summaries cr ON rid=cr.record_id
        WHERE
            a.record_id=ANY (c.continuation_records)
    ) continuations ON TRUE
    -- Convert parent record to JSON
    CROSS JOIN LATERAL (
        SELECT
            COALESCE(ROW_TO_JSON(parent_record), NULL) AS parent
    ) parent;

DROP TABLE IF EXISTS unknown_relations;

CREATE TABLE
    unknown_relations AS
SELECT
    related_records.*,
    '' AS
TYPE,
'' AS notes,
'' AS "user",
NULL::timestamptz AS updated_at,
c.call_number AS call_number_1,
d.call_number AS call_number_2,
c.generation AS generation_1,
d.generation AS generation_2,
c.format AS format_1,
d.format AS format_2
FROM
    related_records
    JOIN records a ON docid_1=a.record_id
    JOIN records b ON docid_2=b.record_id
    JOIN freedom_archives_old.documents c ON docid_1=c.docid
    JOIN freedom_archives_old.documents d ON docid_2=d.docid
WHERE
    REPLACE(title_1, 'Copy of ', '')!=REPLACE(title_2, 'Copy of ', '')
    AND docid_1!=docid_2
    AND id NOT IN (
        SELECT
            id
        FROM
            duplicate_relations
    )
ORDER BY
    docid_1;

DROP TABLE IF EXISTS parent_lookup;

-- CREATE VIEW
--     value_lookup AS
-- SELECT DISTINCT
--     call_number AS VALUE
-- FROM
--     instances
-- WHERE
--     call_number!=''
--     AND call_Number!=' '
-- ORDER BY
--     call_number;
SELECT
    SETVAL(
        'collections_collection_id_seq',
        (
            SELECT
                MAX(collection_id)
            FROM
                collections
        )
    );

SELECT
    SETVAL(
        'records_record_id_seq',
        (
            SELECT
                MAX(record_id)
            FROM
                records
        )
    );

SELECT
    SETVAL(
        'users_user_id_seq',
        (
            SELECT
                MAX(user_id)
            FROM
                users
        )
    );

DROP VIEW IF EXISTS list_items_lookup;

CREATE OR REPLACE VIEW
    list_items_lookup AS -- Author items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    0 AS collections_count,
    0 AS instances_count
FROM
    list_items li
    LEFT JOIN records_to_list_items r ON li.list_item_id=r.list_item_id
WHERE
    li.type='author'
GROUP BY
    li.list_item_id
UNION ALL
-- Keyword items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    COUNT(DISTINCT c.collection_id) AS collections_count,
    0 AS instances_count
FROM
    list_items li
    LEFT JOIN records_to_list_items r ON li.list_item_id=r.list_item_id
    LEFT JOIN collections_to_list_items c ON li.list_item_id=c.list_item_id
WHERE
    li.type='keyword'
GROUP BY
    li.list_item_id
UNION ALL
-- Producer items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    0,
    0 AS instances_count
FROM
    list_items li
    LEFT JOIN records_to_list_items r ON li.list_item_id=r.list_item_id
WHERE
    li.type='producer'
GROUP BY
    li.list_item_id
UNION ALL
-- Subject items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    COUNT(DISTINCT c.collection_id) AS collections_count,
    0 AS instances_count
FROM
    list_items li
    LEFT JOIN records_to_list_items r ON li.list_item_id=r.list_item_id
    LEFT JOIN collections_to_list_items c ON li.list_item_id=c.list_item_id
WHERE
    li.type='subject'
GROUP BY
    li.list_item_id
UNION ALL
-- Program items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    0 AS collections_count,
    0 AS instances_count
FROM
    list_items li
    LEFT JOIN records r ON li.list_item_id=r.program_id
WHERE
    li.type='program'
GROUP BY
    li.list_item_id
UNION ALL
-- Publisher items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    COUNT(DISTINCT c.collection_id) AS collections_count,
    0 AS instances_count
FROM
    list_items li
    LEFT JOIN records r ON li.list_item_id=r.publisher_id
    LEFT JOIN collections c ON li.list_item_id=c.publisher_id
WHERE
    li.type='publisher'
GROUP BY
    li.list_item_id
UNION ALL
-- Format items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    COUNT(DISTINCT i.instance_id) AS instances_count
FROM
    list_items li
    LEFT JOIN instances i ON li.list_item_id=i.format_id
WHERE
    li.type='format'
GROUP BY
    li.list_item_id
UNION ALL
-- Quality items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    COUNT(DISTINCT i.instance_id) AS instances_count
FROM
    list_items li
    LEFT JOIN instances i ON li.list_item_id=i.quality_id
WHERE
    li.type='quality'
GROUP BY
    li.list_item_id
UNION ALL
-- Generation items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    COUNT(DISTINCT i.instance_id) AS instances_count
FROM
    list_items li
    LEFT JOIN instances i ON li.list_item_id=i.generation_id
WHERE
    li.type='generation'
GROUP BY
    li.list_item_id
UNION ALL
-- Call number items
SELECT
    li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    0 AS records_count,
    COUNT(DISTINCT c.collection_id) AS collections_count,
    COUNT(DISTINCT i.instance_id) AS instances_count
FROM
    list_items li
    LEFT JOIN collections c ON li.list_item_id=c.call_number_id
    LEFT JOIN instances i ON li.list_item_id=i.call_number_id
WHERE
    li.type='call_number'
GROUP BY
    li.list_item_id;

-- $query = "
-- 			select * from (
-- 			select DOCID as id, TITLE as description, 'document' as type, CONTRIBUTOR as user, IF(DATE_MODIFIED = DATE_CREATED, 'create', 'update') as action,
-- 				NEEDS_REVIEW, collection_id, unix_timestamp(DATE_MODIFIED) as time from DOCUMENTS where unix_timestamp(DATE_MODIFIED) > $date $needs_review
-- 			union
-- 				select COLLECTION_ID as id, COLLECTION_NAME as description, 'collection' as type, CONTRIBUTOR as user, IF(DATE_MODIFIED = DATE_CREATED, 'create', 'update') as action,
-- 					NEEDS_REVIEW, parent_id as collection_id, unix_timestamp(DATE_MODIFIED) as time from COLLECTIONS where unix_timestamp(DATE_MODIFIED) > $date $needs_review
-- 			) a order by time desc
CREATE OR REPLACE VIEW
    review_changes AS
SELECT
    record_id AS id,
    collection_id,
    title,
    'record' AS
TYPE,
(
    CASE
        WHEN date_created=date_modified THEN 'create'
        ELSE 'update'
    END
) AS ACTION,
COALESCE(date_modified, date_created) AS date_modified,
needs_review,
contributor_user_id,
contributor_name
FROM
    unified_records
WHERE
    date_modified IS NOT NULL
UNION
SELECT
    collection_id AS id,
    collection_id AS collection_id,
    collection_name,
    'collection' AS
TYPE,
(
    CASE
        WHEN date_created=date_modified THEN 'create'
        ELSE 'update'
    END
) AS ACTION,
COALESCE(date_modified, date_created) AS date_modified,
needs_review,
contributor_user_id,
contributor_name
FROM
    unified_collections
WHERE
    date_modified IS NOT NULL;