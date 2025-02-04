BEGIN;
-- CREATE TEMP TABLE parent_lookup as select record_id, parent_record_id from records where parent_record_id is not null;
-- select * from `parent_lookup`;
DROP SCHEMA IF EXISTS freedom_archives CASCADE;
CREATE SCHEMA freedom_archives;
-- select * from `parent_lookup`;
SET search_path TO freedom_archives;
-- select * from parent_lookup;
CREATE TABLE archives(
    archive_id serial PRIMARY KEY,
    title text
);
CREATE TYPE user_role AS ENUM('user', 'intern', 'administrator');
CREATE TABLE users(
    user_id serial PRIMARY KEY,
    archive_id integer NOT NULL REFERENCES archives,
    username varchar(50) NOT NULL,
    firstname varchar(50) DEFAULT NULL,
    lastname varchar(50) DEFAULT NULL,
    ROLE user_role DEFAULT NULL,
    password varchar(200) DEFAULT NULL,
    active boolean DEFAULT FALSE,
    email varchar(100) DEFAULT NULL
);
/* call_number
 generation
 program
 author
 producer
 subject
 keyword
 format
 quality */
CREATE TABLE list_items(
    list_item_id serial PRIMARY KEY,
    item varchar(500) NOT NULL,
    type varchar(45) NOT NULL,
    description varchar(200) DEFAULT NULL
);
CREATE INDEX list_items_type_idx ON list_items(type);
CREATE TABLE collections(
    collection_id serial PRIMARY KEY,
    parent_collection_id integer DEFAULT NULL REFERENCES collections,
    collection_name varchar(255) DEFAULT NULL,
    description text,
    summary varchar(255) DEFAULT NULL,
    call_number text,
    publisher_id integer REFERENCES list_items,
    -- publisher text,
    notes text,
    thumbnail varchar(50) DEFAULT NULL,
    display_order integer NOT NULL DEFAULT 1000,
    needs_review bool DEFAULT FALSE,
    is_hidden bool DEFAULT FALSE,
    publish_to_global bool DEFAULT TRUE,
    creator_user_id integer REFERENCES users,
    contributor_user_id integer REFERENCES users,
    date_created timestamptz DEFAULT NULL,
    date_modified timestamptz DEFAULT NULL
);
CREATE TABLE records(
    record_id serial PRIMARY KEY,
    archive_id integer NOT NULL REFERENCES archives,
    title text,
    description text,
    notes text,
    location varchar(100) DEFAULT NULL,
    vol_number varchar(50) DEFAULT NULL,
    collection_id integer DEFAULT 1000 REFERENCES collections,
    parent_record_id integer,
    primary_instance_id integer,
    year int,
    month int,
    day int,
    publisher_id integer REFERENCES list_items,
    program_id integer REFERENCES list_items,
    needs_review bool DEFAULT FALSE,
    is_hidden bool DEFAULT FALSE,
    publish_to_global bool DEFAULT TRUE,
    creator_user_id integer REFERENCES users,
    contributor_user_id integer REFERENCES users,
    date_created timestamptz DEFAULT NULL,
    date_modified timestamptz DEFAULT NULL
);
CREATE TABLE instances(
    instance_id serial PRIMARY KEY,
    call_number text,
    record_id integer NOT NULL REFERENCES records ON DELETE CASCADE,
    -- is_primary bool DEFAULT false,
    format integer REFERENCES list_items,
    no_copies integer DEFAULT '1',
    quality integer REFERENCES list_items,
    generation integer REFERENCES list_items,
    url varchar(255) NOT NULL DEFAULT '',
    thumbnail varchar(45) DEFAULT NULL,
    media_type varchar(20) NOT NULL DEFAULT '',
    creator_user_id integer REFERENCES users,
    contributor_user_id integer REFERENCES users,
    date_created timestamptz DEFAULT NULL,
    date_modified timestamptz DEFAULT NULL,
    original_doc_id integer DEFAULT NULL
);
CREATE INDEX instances_call_number ON instances(call_number);
CREATE INDEX instances_format ON instances(format);
CREATE INDEX instances_quality ON instances(quality);
CREATE INDEX instances_generation ON instances(generation);
CREATE INDEX instances_media_type ON instances(media_type);
CREATE TABLE featured_records(
    record_id integer REFERENCES records ON DELETE CASCADE,
    collection_id integer NOT NULL REFERENCES collections ON DELETE CASCADE,
    record_order integer DEFAULT NULL,
    label varchar(60) DEFAULT NULL
);
CREATE UNIQUE INDEX featured_records_idx ON featured_records(collection_id, record_id);
CREATE TABLE records_to_list_items(
    list_item_id integer NOT NULL REFERENCES list_items on DELETE CASCADE,
    record_id integer NOT NULL REFERENCES records ON DELETE CASCADE,
    PRIMARY KEY (list_item_id, record_id)
);
CREATE TABLE collections_to_list_items(
    list_item_id integer NOT NULL REFERENCES list_items ON DELETE CASCADE,
    collection_id integer NOT NULL REFERENCES collections ON DELETE CASCADE,
    PRIMARY KEY (list_item_id, collection_id)
);
CREATE TABLE instances_to_list_items(
    list_item_id integer NOT NULL REFERENCES list_items ON DELETE CASCADE,
    instance_id integer NOT NULL REFERENCES instances ON DELETE CASCADE,
    PRIMARY KEY (list_item_id, instance_id)
);
CREATE TABLE continuations(
    continuation_id serial PRIMARY KEY,
    continuation_records integer []
);
CREATE TABLE related_records AS
SELECT *
FROM freedom_archives_old.related_records;
/*
 DATE_AVAILABLE
 IDENTIFIER
 SOURCE
 LANGUAGE
 `LANGUAGE` varchar(50) DEFAULT NULL,
 `RELATION` varchar(100) DEFAULT NULL,
 `COVERAGE` varchar(50) DEFAULT NULL,
 `RIGHTS` varchar(50) DEFAULT NULL,
 `AUDIENCE` varchar(255) DEFAULT NULL,
 `DIGITIZATION_SPECIFICATION` varchar(100) DEFAULT NULL,
 `FILE_NAME` varchar(1000) DEFAULT NULL,
 `DOC_TEXT` text,
 `PBCORE_CREATOR` varchar(255) DEFAULT NULL,
 `PBCORE_COVERAGE` varchar(20) DEFAULT NULL,
 `PBCORE_RIGHTS_SUMMARY` varchar(255) DEFAULT NULL,
 `PBCORE_EXTENSION` varchar(255) DEFAULT NULL,
 `FILE_EXTENSION` text,
 `URL_TEXT` varchar(255) DEFAULT NULL,
 `LENGTH` varchar(50) DEFAULT NULL, */
INSERT INTO archives
VALUES (DEFAULT, 'The Freedom Archives');
INSERT INTO users(
        SELECT user_id,
            1,
            lower(username),
            firstname,
            lastname,
            lower(user_type)::user_role,
            PASSWORD,
            coalesce(status, '') = 'active',
            email
        FROM freedom_archives_old.users
    );
INSERT INTO list_items(item, type, description)(
        SELECT item,
            type,
            description
        FROM freedom_archives_old.list_items
    );
INSERT INTO list_items(item, type)(
        SELECT DISTINCT publisher,
            'publisher'
        FROM (
                SELECT publisher
                FROM freedom_archives_old.documents
                UNION
                SELECT organization
                FROM freedom_archives_old.collections
            ) a
        WHERE publisher != ''
        ORDER BY publisher
    );
INSERT INTO collections(collection_id, collection_name, display_order)
VALUES (0, 'Uncategorized', 0);
INSERT INTO collections(
        SELECT collection_id,
            parent_id,
            collection_name,
            a.description,
            summary,
            call_number,
            publisher_lookup.list_item_id,
            internal_notes AS notes,
            thumbnail,
            display_order,
            needs_review::bool,
            is_hidden::bool,
            TRUE,
            b.user_id AS creator_user_id,
            c.user_id AS contributor_user_id,
            NULL,
            date_modified
        FROM freedom_archives_old.collections a
            LEFT JOIN list_items publisher_lookup ON a.organization = publisher_lookup.item
            AND publisher_lookup.type = 'publisher'
            LEFT JOIN users b ON a.creator = b.username
            LEFT JOIN users c ON a.contributor = c.username
    );
/* FIXME: Call number relation */
/* FIXME: list_items missing stuff */
/* FIXME: year/month/day -> date field */
/* FIXME: normalize dates: select docid, a.year, a.month, a.day, b.year, b.month, b.day from freedom_archives_old.documents a join records_view b on docid = record_id where a.year != b.year::text or a.month != b.month::text or a.day != b.day::text; */
INSERT INTO records(
        SELECT docid AS record_id,
            1,
            title,
            a.description,
            notes,
            location,
            vol_number,
            CASE
                collection_id
                WHEN 112 THEN 1000
                ELSE collection_id
            END,
            NULL,
            NULL,
            nullif(regexp_replace(year, '[^0-9]', '', 'g'), '')::int,
            nullif(regexp_replace(month, '[^0-9]', '', 'g'), '')::int,
            nullif(regexp_replace(day, '[^0-9]', '', 'g'), '')::int,
            publisher_lookup.list_item_id,
            program_lookup.list_item_id,
            needs_review::bool,
            is_hidden::bool,
            TRUE,
            b.user_id AS creator_user_id,
            c.user_id AS contributor_user_id,
            date_created,
            date_modified
        FROM freedom_archives_old.documents a
            LEFT JOIN users b ON a.creator = b.username
            LEFT JOIN users c ON a.contributor = c.username
            LEFT JOIN list_items call_number_lookup ON a.call_number = call_number_lookup.item
            AND call_number_lookup.type = 'call_number'
            LEFT JOIN list_items publisher_lookup ON a.publisher = publisher_lookup.item
            AND publisher_lookup.type = 'publisher'
            LEFT JOIN list_items program_lookup ON a.program = program_lookup.item
            AND program_lookup.type = 'program'
    );
INSERT INTO featured_records(
        SELECT docid AS record_id,
            collection_id,
            doc_order AS record_order,
            description AS label
        FROM freedom_archives_old.featured_docs
    );
/* update records set month = b.value from
 select month, b.value from records a join (
 select docid, b.value from freedom_archives_old.documents a join (
 select * from (
 values
 ('Ja', 1),
 ('Fe', 2)
 ) as i(month, value)
 ) b using (month)
 ) b on a.record_id = b.docid */
UPDATE records
SET month = '1'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Ja'
    );
UPDATE records
SET month = '2'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Fe'
    );
UPDATE records
SET month = '3'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Ma'
    );
UPDATE records
SET month = '4'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Ap'
    );
UPDATE records
SET month = '5'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Ma'
    );
UPDATE records
SET month = '6'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Ju'
    );
UPDATE records
SET month = '7'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Ju'
    );
UPDATE records
SET month = '8'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Au'
            OR month = 'Ag'
    );
UPDATE records
SET month = '9'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Se'
    );
UPDATE records
SET month = '10'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'Oc'
    );
UPDATE records
SET month = '11'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'No'
    );
UPDATE records
SET month = '12'
WHERE record_id IN (
        SELECT docid
        FROM freedom_archives_old.documents
        WHERE month = 'De'
    );
UPDATE records
SET day = 30
WHERE month IN (6, 9)
    AND day = 31;
UPDATE records
SET year = 2005
WHERE record_id = 28007;
UPDATE records
SET year = year + 1900
WHERE year >(
        extract(
            year
            FROM CURRENT_DATE
        ) - 2000
    )
    AND year <= 99;
UPDATE records
SET year = year + 2000
WHERE year <=(
        extract(
            year
            FROM CURRENT_DATE
        ) - 2000
    );
UPDATE records
SET year = 2005
WHERE year = 20042005;
SELECT record_id,
    title,
    year
FROM records
WHERE year > extract(
        year
        FROM CURRENT_DATE
    );
SELECT record_id,
    title,
    year
FROM records
WHERE year < 1900;
UPDATE records
SET year = NULL
WHERE year > extract(
        year
        FROM CURRENT_DATE
    );
INSERT INTO records_to_list_items(
        SELECT DISTINCT list_item_id,
            id AS record_id
        FROM freedom_archives_old.list_items_lookup a
            JOIN freedom_archives.list_items b ON a.item = b.item
            AND a.type = b.type
            JOIN records ON id = record_id
        WHERE is_doc = 1
    );
INSERT INTO collections_to_list_items(
        SELECT DISTINCT list_item_id,
            id AS collection_id
        FROM freedom_archives_old.list_items_lookup a
            JOIN freedom_archives.list_items b ON a.item = b.item
            AND a.type = b.type
            JOIN collections ON id = collection_id
        WHERE is_doc = 0
    );
/* instance_id serial PRIMARY KEY,
 record_id integer NOT NULL REFERENCES records ON DELETE CASCADE,
 is_primary bool DEFAULT false,
 format varchar(100) DEFAULT NULL,
 no_copies integer DEFAULT '1',
 quality text,
 url varchar(255) NOT NULL DEFAULT '',
 thumbnail varchar(45) DEFAULT NULL,
 media_type varchar(20) NOT NULL DEFAULT '',
 creator_user_id integer REFERENCES users,
 contributor_user_id integer REFERENCES users,
 date_created timestamp DEFAULT NULL,
 date_modified timestamp DEFAULT NULL,
 original_doc_id integer DEFAULT NULL */
CREATE TABLE duplicate_relations AS
SELECT id
FROM freedom_archives_old.related_records
WHERE docid_1 = docid_2
    AND title_1 = title_2
    AND description_1 = description_2
    AND track_number_1 = track_number_2;
INSERT INTO instances(
        record_id,
        call_number,
        format,
        no_copies,
        quality,
        generation,
        url,
        thumbnail,
        media_type,
        creator_user_id,
        contributor_user_id,
        date_created,
        date_modified,
        original_doc_id
    )
SELECT docid AS record_id,
    call_number,
    format_lookup.list_item_id,
    no_copies,
    quality_lookup.list_item_id,
    generation_lookup.list_item_id,
    url,
    thumbnail,
    media_type,
    b.user_id AS creator_user_id,
    c.user_id AS contributor_user_id,
    date_created,
    date_modified,
    docid
FROM freedom_archives_old.documents a
    LEFT JOIN users b ON a.creator = b.username
    LEFT JOIN users c ON a.contributor = c.username
    LEFT JOIN list_items format_lookup ON a.format = format_lookup.item
    AND format_lookup.type = 'format'
    LEFT JOIN list_items quality_lookup ON a.quality = quality_lookup.item
    AND quality_lookup.type = 'quality'
    LEFT JOIN list_items generation_lookup ON a.generation = generation_lookup.item
    AND generation_lookup.type = 'generation';
UPDATE records a
SET primary_instance_id = b.instance_id
FROM instances b
WHERE a.record_id = b.record_id;
DELETE FROM freedom_archives_old.related_records
WHERE docid_1 NOT IN (
        SELECT record_id
        FROM records
    )
    OR docid_2 NOT IN (
        SELECT record_id
        FROM records
    );
INSERT INTO instances(
        record_id,
        call_number,
        format,
        no_copies,
        quality,
        generation,
        url,
        thumbnail,
        media_type,
        creator_user_id,
        contributor_user_id,
        date_created,
        date_modified,
        original_doc_id
    )
SELECT x.docid_1 AS record_id,
    a.call_number AS call_number,
    format_lookup.list_item_id,
    no_copies,
    quality_lookup.list_item_id,
    generation_lookup.list_item_id,
    url,
    thumbnail,
    media_type,
    b.user_id AS creator_user_id,
    c.user_id AS contributor_user_id,
    date_created,
    date_modified,
    x.docid_2
FROM (
        SELECT docid_1,
            docid_2
        FROM freedom_archives_old.related_records
        WHERE replace(title_1, 'Copy of ', '') = replace(title_2, 'Copy of ', '')
            AND docid_1 != docid_2
            AND id NOT IN (
                SELECT id
                FROM duplicate_relations
            )
    ) x
    JOIN freedom_archives_old.documents a ON a.docid = x.docid_2
    LEFT JOIN users b ON a.creator = b.username
    LEFT JOIN users c ON a.contributor = c.username
    LEFT JOIN list_items format_lookup ON a.format = format_lookup.item
    AND format_lookup.type = 'format'
    LEFT JOIN list_items quality_lookup ON a.quality = quality_lookup.item
    AND quality_lookup.type = 'quality'
    LEFT JOIN list_items generation_lookup ON a.generation = generation_lookup.item
    AND generation_lookup.type = 'generation';
DROP VIEW IF EXISTS instances_view;
CREATE VIEW instances_view AS
SELECT a.*,
    jsonb_build_object(
        'item',
        format_lookup.item,
        'list_item_id',
        format_lookup.list_item_id
    ) AS format_item,
    jsonb_build_object(
        'item',
        quality_lookup.item,
        'list_item_id',
        quality_lookup.list_item_id
    ) AS quality_item,
    jsonb_build_object(
        'item',
        generation_lookup.item,
        'list_item_id',
        generation_lookup.list_item_id
    ) AS generation_item,
    contributor.firstname || ' ' || contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    creator.firstname || ' ' || creator.lastname AS creator_name,
    creator.username AS creator_username,
    EXISTS (
        SELECT record_id
        FROM records
        WHERE instance_id = records.primary_instance_id
    ) AS is_primary
FROM instances a
    LEFT JOIN list_items format_lookup ON format = format_lookup.list_item_id
    LEFT JOIN list_items quality_lookup ON quality = quality_lookup.list_item_id
    LEFT JOIN list_items generation_lookup ON generation = generation_lookup.list_item_id
    LEFT JOIN users contributor ON a.contributor_user_id = contributor.user_id
    LEFT JOIN users creator ON a.creator_user_id = creator.user_id;
DROP VIEW IF EXISTS records_list_items_view;
CREATE VIEW records_list_items_view AS
SELECT b.record_id,
    a.type,
    array_to_json(
        array_agg(
            ROW_TO_JSON(
                (
                    SELECT i
                    FROM (
                            SELECT a.list_item_id,
                                a.item
                        ) i
                )
            )
            ORDER BY item
        )
    )::jsonb AS items,
    string_agg(
        a.item,
        ' '
        ORDER BY a.item
    ) AS items_text,
    array_agg(
        a.item
        ORDER BY a.item
    ) AS items_search
FROM list_items a
    JOIN records_to_list_items b USING (list_item_id)
GROUP BY b.record_id,
    a.type;
DROP VIEW IF EXISTS collections_list_items_view;
CREATE VIEW collections_list_items_view AS
SELECT b.collection_id,
    a.type,
    array_to_json(
        array_agg(
            ROW_TO_JSON(
                (
                    SELECT i
                    FROM (
                            SELECT a.list_item_id,
                                a.item
                        ) i
                )
            )
            ORDER BY item
        )
    )::jsonb AS items,
    string_agg(
        a.item,
        ' '
        ORDER BY a.item
    ) AS items_text,
    array_agg(
        a.item
        ORDER BY a.item
    ) AS items_search
FROM list_items a
    JOIN collections_to_list_items b USING (list_item_id)
GROUP BY b.collection_id,
    a.type;
DROP VIEW IF EXISTS collection_summaries;
CREATE VIEW collection_summaries AS
SELECT a.collection_id,
    a.collection_name,
    a.parent_collection_id,
    a.thumbnail,
    a.call_number,
    a.display_order,
    COALESCE(
        (
            SELECT row_to_json(c)
            FROM (
                    SELECT collection_id,
                        collection_name,
                        thumbnail,
                        parent_collection_id,
                        call_number
                    FROM collections c
                    WHERE a.parent_collection_id = c.collection_id
                ) c
        ),
        '{}'
    ) AS parent
FROM collections a;
DROP VIEW IF EXISTS collections_view;
CREATE VIEW collections_view AS
SELECT a.*,
    contributor.firstname || ' ' || contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    creator.firstname || ' ' || creator.lastname AS creator_name,
    creator.username AS creator_username,
    jsonb_build_object(
        'item',
        publisher_lookup.item,
        'list_item_id',
        publisher_lookup.list_item_id
    ) AS publisher,
    COALESCE(subjects.items, '[]') AS subjects,
    COALESCE(keywords.items, '[]') AS keywords,
    subjects.items_text AS subjects_text,
    keywords.items_text AS keywords_text,
    subjects.items_search AS subjects_search,
    keywords.items_search AS keywords_search,
    array_to_json(
        ARRAY (
            SELECT json_build_object(
                    'record_id',
                    b.record_id,
                    'title',
                    b.title,
                    'parent_record_id',
                    b.parent_record_id,
                    'primary_instance_thumbnail',
                    primary_instance.thumbnail,
                    'primary_instance_format',
                    primary_instance.format,
                    'primary_instance_format_text',
                    list_items.item,
                    'primary_instance_media_type',
                    primary_instance.media_type
                )
            FROM records b
                LEFT JOIN instances primary_instance ON b.primary_instance_id = primary_instance.instance_id
                LEFT JOIN list_items ON primary_instance.format = list_items.list_item_id
                AND list_items.type = 'format'
            WHERE a.collection_id = b.collection_id
            ORDER BY b.title
        )
    ) AS child_records,
    array_to_json(
        ARRAY (
            SELECT json_build_object(
                    'record_id',
                    b.record_id,
                    'title',
                    b.title,
                    'parent_record_id',
                    b.parent_record_id,
                    'primary_instance_thumbnail',
                    primary_instance.thumbnail,
                    'primary_instance_format',
                    primary_instance.format,
                    'primary_instance_format_text',
                    list_items.item,
                    'primary_instance_media_type',
                    primary_instance.media_type,
                    'label',
                    f.label,
                    'record_order',
                    f.record_order
                )
            FROM records b
                LEFT JOIN featured_records f ON b.record_id = f.record_id
                LEFT JOIN instances primary_instance ON b.primary_instance_id = primary_instance.instance_id
                LEFT JOIN list_items ON primary_instance.format = list_items.list_item_id
                AND list_items.type = 'format'
            WHERE a.collection_id = f.collection_id
            ORDER BY f.record_order,
                b.title
        )
    ) AS featured_records
FROM collections a
    LEFT JOIN list_items publisher_lookup ON a.publisher_id = publisher_lookup.list_item_id
    LEFT JOIN users contributor ON a.contributor_user_id = contributor.user_id
    LEFT JOIN users creator ON a.creator_user_id = creator.user_id
    LEFT JOIN collections_list_items_view subjects ON subjects.type = 'subject'
    AND subjects.collection_id = a.collection_id
    LEFT JOIN collections_list_items_view keywords ON keywords.type = 'keyword'
    AND keywords.collection_id = a.collection_id;
DROP TABLE IF EXISTS _unified_collections CASCADE;
CREATE TABLE _unified_collections AS
SELECT *
FROM collections_view;
-- CREATE INDEX collections_fulltext_index on unified_collections using GIN (fulltext);
ALTER TABLE _unified_collections
ADD PRIMARY KEY (collection_id);
CREATE OR REPLACE VIEW unified_collections AS
SELECT a.*,
    COALESCE(
        (
            SELECT row_to_json(p)
            FROM collection_summaries p
            WHERE a.parent_collection_id = p.collection_id
        ),
        '{}'
    ) AS parent,
    ARRAY (
        SELECT row_to_json(collection_summaries)
        FROM collection_summaries
        WHERE collection_summaries.parent_collection_id = a.collection_id
        ORDER BY collection_summaries.display_order
    ) AS children
FROM _unified_collections a
    LEFT JOIN collection_summaries b USING (collection_id);
DROP VIEW IF EXISTS record_summaries;
CREATE VIEW record_summaries AS
SELECT a.record_id,
    a.title,
    a.parent_record_id,
    primary_instance.thumbnail AS primary_instance_thumbnail,
    primary_instance.format AS primary_instance_format,
    list_items.item AS primary_instance_format_text,
    primary_instance.media_type AS primary_instance_media_type,
    COALESCE(
        (
            SELECT row_to_json(c)
            FROM collection_summaries c
            WHERE a.collection_id = c.collection_id
        ),
        '{}'
    ) AS collection
FROM records a
    LEFT JOIN instances primary_instance ON a.primary_instance_id = primary_instance.instance_id
    LEFT JOIN list_items ON primary_instance.format = list_items.list_item_id
    AND list_items.type = 'format';
/* FIXME collection */
DROP VIEW IF EXISTS records_view;
CREATE VIEW records_view AS
SELECT a.*,
    -- b.primary_instance_thumbnail,
    -- b.primary_instance_format,
    -- b.primary_instance_format_text,
    -- b.primary_instance_media_type,
    -- b.collection,
    coalesce(lpad(a.month::text, 2, '0'), '00') || '/' || coalesce(lpad(a.day::text, 2, '0'), '00') || '/' || coalesce(a.year::text, '0000') AS date_string,
    (
        coalesce(a.year::text, '1900')::text || '-' || coalesce(a.month::text, '01')::text || '-' || coalesce(a.day::text, '01')::text
    )::date AS date,
    jsonb_build_object(
        'item',
        publisher_lookup.item,
        'list_item_id',
        publisher_lookup.list_item_id
    ) AS publisher,
    jsonb_build_object(
        'item',
        program_lookup.item,
        'list_item_id',
        program_lookup.list_item_id
    ) AS program,
    coalesce(instances.instances, '[]') AS instances,
    instances.has_digital AS has_digital,
    COALESCE(instances.instance_count, 0) AS instance_count,
    contributor.firstname || ' ' || contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    creator.firstname || ' ' || creator.lastname AS creator_name,
    creator.username AS creator_username,
    ARRAY (
        SELECT DISTINCT call_number
        FROM instances
        WHERE instances.record_id = a.record_id
            AND call_number IS NOT NULL
    ) AS call_numbers,
    ARRAY (
        SELECT DISTINCT format
        FROM instances
        WHERE instances.record_id = a.record_id
            AND format IS NOT NULL
    ) AS formats,
    ARRAY (
        SELECT DISTINCT quality
        FROM instances
        WHERE instances.record_id = a.record_id
            AND quality IS NOT NULL
    ) AS qualitys,
    ARRAY (
        SELECT DISTINCT generation
        FROM instances
        WHERE instances.record_id = a.record_id
            AND generation IS NOT NULL
    ) AS generations,
    ARRAY (
        SELECT DISTINCT media_type
        FROM instances
        WHERE instances.record_id = a.record_id
            AND media_type IS NOT NULL
    ) AS media_types,
    coalesce(authors.items, '[]') AS authors,
    coalesce(subjects.items, '[]') AS subjects,
    coalesce(keywords.items, '[]') AS keywords,
    coalesce(producers.items, '[]') AS producers,
    authors.items_text AS authors_text,
    subjects.items_text AS subjects_text,
    keywords.items_text AS keywords_text,
    producers.items_text AS producers_text,
    authors.items_search AS authors_search,
    subjects.items_search AS subjects_search,
    keywords.items_search AS keywords_search,
    producers.items_search AS producers_search,
    setweight(
        to_tsvector('english', coalesce(a.title, '')),
        'A'
    ) || setweight(
        to_tsvector('english', coalesce(a.description, '')),
        'B'
    ) || setweight(
        to_tsvector('english', coalesce(authors.items_text, '')),
        'C'
    ) || setweight(
        to_tsvector('english', coalesce(subjects.items_text, '')),
        'C'
    ) || setweight(
        to_tsvector('english', coalesce(keywords.items_text, '')),
        'C'
    ) AS fulltext -- array(select distinct call_number from instances where instances.record_id = a.record_id and call_number is not null) as call_numbers,
    -- array(select distinct format from instances where instances.record_id = a.record_id and format is not null) as formats,
    -- array(select distinct quality from instances where instances.record_id = a.record_id and quality is not null) as qualitys,
    -- array(select distinct generation from instances where instances.record_id = a.record_id and generation is not null) as generations,
    -- array(select distinct media_type from instances where instances.record_id = a.record_id and media_type is not null) as media_types
    -- array(select row_to_json(record_summaries) from record_summaries where record_summaries.parent_record_id = a.record_id) as children,
    -- array(select row_to_json(record_summaries) from record_summaries where record_summaries.parent_record_id = a.parent_record_id and record_summaries.record_id != a.record_id) as siblings,
    -- (select row_to_json(parent) from record_summaries parent where a.parent_record_id = parent.record_id) as parent
FROM records a -- left join record_summaries b using (record_id)
    -- left join record_summaries parent on a.parent_record_id = parent.record_id
    LEFT JOIN list_items publisher_lookup ON a.publisher_id = publisher_lookup.list_item_id
    LEFT JOIN list_items program_lookup ON a.program_id = program_lookup.list_item_id
    LEFT JOIN (
        SELECT record_id,
            bool_or(url != '') AS has_digital,
            count(*) AS instance_count,
            array_to_json(
                array_agg(
                    row_to_json(b)
                    ORDER BY b.is_primary DESC,
                        b.instance_id
                )
            ) AS instances
        FROM instances_view b
        GROUP BY record_id
    ) instances USING (record_id)
    LEFT JOIN instances primary_instance ON a.primary_instance_id = primary_instance.instance_id
    LEFT JOIN users contributor ON a.contributor_user_id = contributor.user_id
    LEFT JOIN users creator ON a.creator_user_id = creator.user_id -- left join (select parent_record_id, array_to_json(array_agg(row_to_json(b))) as children from (select parent_record_id, record_id, title from records) b group by parent_record_id) children on children.parent_record_id = a.record_id
    -- left join
    --   (select parent_record_id,
    --           array_to_json(array_agg(row_to_json(b))) as siblings
    --    from
    --      (select parent_record_id,
    --              record_id,
    --              title
    --       from records) b
    --    group by parent_record_id) siblings on siblings.parent_record_id = a.parent_record_id
    LEFT JOIN records_list_items_view authors ON authors.type = 'author'
    AND authors.record_id = a.record_id
    LEFT JOIN records_list_items_view subjects ON subjects.type = 'subject'
    AND subjects.record_id = a.record_id
    LEFT JOIN records_list_items_view keywords ON keywords.type = 'keyword'
    AND keywords.record_id = a.record_id
    LEFT JOIN records_list_items_view producers ON producers.type = 'producer'
    AND producers.record_id = a.record_id -- left join records parent on a.parent_record_id = parent.record_id
;
DROP TABLE IF EXISTS _unified_records CASCADE;
CREATE TABLE _unified_records AS
SELECT *
FROM records_view;
CREATE INDEX records_fulltext_index ON _unified_records USING GIN(fulltext);
CREATE INDEX records_year ON _unified_records(year);
CREATE INDEX records_title ON _unified_records(title);
CREATE INDEX records_has_digital ON _unified_records(has_digital);
CREATE INDEX records_collection_id ON _unified_records(collection_id);
-- CREATE INDEX records_keywords_text on _unified_records (keywords_text);
-- CREATE INDEX records_subjects_text on _unified_records (subjects_text);
-- CREATE INDEX records_authors_text on _unified_records (authors_text);
-- CREATE INDEX records_producers_text on _unified_records (producers_text);
CREATE INDEX records_parent_record_id ON _unified_records(parent_record_id);
CREATE INDEX records_call_numbers ON _unified_records USING GIN(call_numbers);
CREATE INDEX records_authors_search ON _unified_records USING GIN(authors_search);
CREATE INDEX records_subjects_search ON _unified_records USING GIN(subjects_search);
CREATE INDEX records_keywords_search ON _unified_records USING GIN(keywords_search);
CREATE INDEX records_producers_search ON _unified_records USING GIN(producers_search);
ALTER TABLE _unified_records
ADD PRIMARY KEY (record_id);
CREATE OR REPLACE VIEW unified_records AS
SELECT a.*,
    b.primary_instance_thumbnail,
    b.primary_instance_format,
    b.primary_instance_format_text,
    b.primary_instance_media_type,
    b.collection,
    ARRAY (
        SELECT row_to_json(record_summaries)
        FROM record_summaries
        WHERE record_summaries.parent_record_id = a.record_id
    ) AS children,
    ARRAY (
        SELECT row_to_json(record_summaries)
        FROM record_summaries
        WHERE record_summaries.parent_record_id = a.parent_record_id
            AND record_summaries.record_id != a.record_id
    ) AS siblings,
    COALESCE(
        (
            SELECT row_to_json(parent)
            FROM record_summaries parent
            WHERE a.parent_record_id = parent.record_id
        ),
        '{}'
    ) AS parent,
    COALESCE(
        ARRAY (
            SELECT row_to_json(cr)
            FROM (
                    SELECT c.continuation_id,
                        continuation_records,
                        rs.*
                    FROM continuations c,
                        unnest(c.continuation_records) WITH ORDINALITY rid
                        JOIN record_summaries rs ON rid = rs.record_id
                    WHERE a.record_id = ANY (c.continuation_records)
                    ORDER BY array_position(c.continuation_records, rid)
                ) cr
        ),
        '{}'
    ) AS continuations -- (select parent from record_summaries parent where a.parent_record_id = parent.record_id) as parent,
FROM _unified_records a
    LEFT JOIN record_summaries b USING (record_id);
DROP TABLE IF EXISTS unknown_relations;
CREATE TABLE unknown_relations AS
SELECT related_records.*,
    '' AS type,
    '' AS notes,
    '' AS "user",
    NULL::timestamptz AS updated_at,
    c.call_number AS call_number_1,
    d.call_number AS call_number_2,
    c.generation AS generation_1,
    d.generation AS generation_2,
    c.format AS format_1,
    d.format AS format_2
FROM related_records
    JOIN records a ON docid_1 = a.record_id
    JOIN records b ON docid_2 = b.record_id
    JOIN freedom_archives_old.documents c ON docid_1 = c.docid
    JOIN freedom_archives_old.documents d ON docid_2 = d.docid
WHERE replace(title_1, 'Copy of ', '') != replace(title_2, 'Copy of ', '')
    AND docid_1 != docid_2
    AND id NOT IN (
        SELECT id
        FROM duplicate_relations
    )
ORDER BY docid_1;
DROP TABLE IF EXISTS parent_lookup;
COMMIT;
CREATE VIEW value_lookup AS
SELECT DISTINCT call_number AS value
FROM instances
WHERE call_number != ''
    AND call_Number != ' '
ORDER BY call_number;
SELECT setval(
        'collections_collection_id_seq',
        (
            SELECT max(collection_id)
            FROM collections
        )
    );
SELECT setval(
        'records_record_id_seq',
        (
            SELECT max(record_id)
            FROM records
        )
    );
DROP VIEW IF EXISTS list_items_lookup;
CREATE OR REPLACE VIEW list_items_lookup AS -- Author items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    0 AS collections_count,
    0 AS instances_count
FROM list_items li
    LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
WHERE li.type = 'author'
GROUP BY li.list_item_id
UNION ALL
-- Keyword items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    COUNT(DISTINCT c.collection_id) AS collections_count,
    0 AS instances_count
FROM list_items li
    LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
    LEFT JOIN collections_to_list_items c ON li.list_item_id = c.list_item_id
WHERE li.type = 'keyword'
GROUP BY li.list_item_id
UNION ALL
-- Producer items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    0,
    0 AS instances_count
FROM list_items li
    LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
WHERE li.type = 'producer'
GROUP BY li.list_item_id
UNION ALL
-- Subject items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    COUNT(DISTINCT c.collection_id) AS collections_count,
    0 AS instances_count
FROM list_items li
    LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
    LEFT JOIN collections_to_list_items c ON li.list_item_id = c.list_item_id
WHERE li.type = 'subject'
GROUP BY li.list_item_id
UNION ALL
-- Program items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    0 AS collections_count,
    0 AS instances_count
FROM list_items li
    LEFT JOIN records r ON li.list_item_id = r.program_id
WHERE li.type = 'program'
GROUP BY li.list_item_id
UNION ALL
-- Publisher items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    COUNT(DISTINCT r.record_id) AS records_count,
    COUNT(DISTINCT c.collection_id) AS collections_count,
    0 AS instances_count
FROM list_items li
    LEFT JOIN records r ON li.list_item_id = r.publisher_id
    LEFT JOIN collections c ON li.list_item_id = c.publisher_id
WHERE li.type = 'publisher'
GROUP BY li.list_item_id
UNION ALL
-- Format items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    COUNT(DISTINCT i.instance_id) AS instances_count
FROM list_items li
    LEFT JOIN instances i ON li.list_item_id = i.format
WHERE li.type = 'format'
GROUP BY li.list_item_id
UNION ALL
-- Quality items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    COUNT(DISTINCT i.instance_id) AS instances_count
FROM list_items li
    LEFT JOIN instances i ON li.list_item_id = i.quality
WHERE li.type = 'quality'
GROUP BY li.list_item_id
UNION ALL
-- Generation items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    COUNT(DISTINCT i.instance_id) AS instances_count
FROM list_items li
    LEFT JOIN instances i ON li.list_item_id = i.generation
WHERE li.type = 'generation'
GROUP BY li.list_item_id
UNION ALL
-- Call number items
SELECT li.list_item_id,
    li.item,
    li.type,
    li.description,
    0 AS records_count,
    COUNT(DISTINCT c.collection_id) AS collections_count,
    COUNT(DISTINCT i.instance_id) AS instances_count
FROM list_items li
    LEFT JOIN collections c ON li.item = split_part(c.call_number, ' ', 1)
    LEFT JOIN instances i ON li.item = split_part(i.call_number, ' ', 1)
WHERE li.type = 'call_number'
GROUP BY li.list_item_id;