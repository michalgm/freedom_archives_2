INSERT INTO
    archives
VALUES
    (DEFAULT, 'The Freedom Archives');

INSERT INTO
    users (
        SELECT
            user_id,
            1,
            LOWER(username),
            firstname,
            lastname,
            LOWER(user_type)::user_role,
            PASSWORD,
            COALESCE(status, '')='active',
            email
        FROM
            freedom_archives_old.users
    );

INSERT INTO
    list_items (
        archive_id,
        item,
        TYPE,
        description
    ) (
        SELECT
            1,
            (
                ARRAY_AGG(
                    orig_item
                    ORDER BY
                        caps DESC
                )
            ) [1] AS item,
        TYPE,
        MAX(description) AS DESC
        FROM
            (
                SELECT
                    LOWER(TRIM(item)) AS item,
                    TRIM(item) AS orig_item,
                TYPE,
                CASE TRIM(description)
                    WHEN '' THEN NULL
                    ELSE TRIM(description)
                END AS description,
                regexp_count (item, '[A-Z]') AS caps
                FROM
                    freedom_archives_old.list_items
                WHERE
                    TRIM(item)!=''
            )
        GROUP BY
            (
                item,
                TYPE
            )
    );

INSERT INTO
    list_items (
        archive_id,
        item,
        TYPE
    ) (
        SELECT
            1,
            (
                ARRAY_AGG(
                    publisher
                    ORDER BY
                        caps DESC
                )
            ) [1],
            'publisher'
        FROM
            (
                SELECT
                    publisher,
                    regexp_count (publisher, '[A-Z]') AS caps
                FROM
                    freedom_archives_old.documents
                UNION
                SELECT
                    organization,
                    regexp_count (organization, '[A-Z]') AS caps
                FROM
                    freedom_archives_old.collections
            ) a
        WHERE
            publisher!=''
        GROUP BY
            (LOWER(TRIM(publisher)))
    );

INSERT INTO
    collections (collection_id, collection_name, display_order)
VALUES
    (0, 'Featured', 0);

INSERT INTO
    collections (
        SELECT
            collection_id,
            1,
            parent_id,
            collection_name,
            public.clean_html ((a.description)),
            public.strip_tags (public.clean_html (a.description)),
            summary,
            (
                SELECT
                    list_item_id
                FROM
                    list_items
                WHERE
                    item=TRIM(SPLIT_PART(call_number, ' ', 1))
                    AND
                TYPE='call_number'
            ),
            TRIM(
                SUBSTRING(
                    call_number
                    FROM
                        '^[A-z\/]+ (.+)$'
                )
            ),
            publisher_lookup.list_item_id,
            internal_notes AS notes,
            thumbnail,
            display_order,
            TRIM(date_range),
            needs_review::bool,
            is_hidden::bool,
            b.user_id AS creator_user_id,
            c.user_id AS contributor_user_id,
            NULL,
            date_modified
        FROM
            freedom_archives_old.collections a
            LEFT JOIN list_items publisher_lookup ON a.organization=publisher_lookup.item
            AND publisher_lookup.type='publisher'
            LEFT JOIN users b ON LOWER(a.creator)=b.username
            LEFT JOIN users c ON LOWER(a.contributor)=c.username
    );

/* FIXME: Call number relation */
/* FIXME: list_items missing stuff */
/* FIXME: year/month/day -> date field */
/* FIXME: normalize dates: select docid, a.year, a.month, a.day, b.year, b.month, b.day from freedom_archives_old.documents a join records_view b on docid = record_id where a.year != b.year::text or a.month != b.month::text or a.day != b.day::text; */
INSERT INTO
    records (
        SELECT
            docid AS record_id,
            1,
            title,
            a.description,
            notes,
            LOCATION,
            vol_number,
            CASE collection_id
                WHEN 112 THEN 1000
                ELSE collection_id
            END,
            NULL,
            NULL,
            NULLIF(REGEXP_REPLACE(YEAR, '[^0-9]', '', 'g'), '')::INT,
            NULLIF(REGEXP_REPLACE(MONTH, '[^0-9]', '', 'g'), '')::INT,
            NULLIF(REGEXP_REPLACE(DAY, '[^0-9]', '', 'g'), '')::INT,
            year_is_circa,
            publisher_lookup.list_item_id,
            program_lookup.list_item_id,
            needs_review::bool,
            is_hidden::bool,
            b.user_id AS creator_user_id,
            c.user_id AS contributor_user_id,
            date_created,
            date_modified
        FROM
            freedom_archives_old.documents a
            LEFT JOIN users b ON LOWER(a.creator)=b.username
            LEFT JOIN users c ON LOWER(a.contributor)=c.username -- LEFT JOIN list_items call_number_lookup ON a.call_number = call_number_lookup.item AND
            -- call_number_lookup.type = 'call_number'
            LEFT JOIN list_items publisher_lookup ON a.publisher=publisher_lookup.item
            AND publisher_lookup.type='publisher'
            LEFT JOIN list_items program_lookup ON a.program=program_lookup.item
            AND program_lookup.type='program'
    );

INSERT INTO
    featured_records (
        SELECT
            docid AS record_id,
            1,
            collection_id,
            doc_order AS record_order,
            description AS LABEL
        FROM
            freedom_archives_old.featured_docs
    );

/*
DATE_AVAILABLE
IDENTIFIER
SOURCE
LANGUAGE
`LANGUAGE` TEXT DEFAULT NULL,
`RELATION` TEXT DEFAULT NULL,
`COVERAGE` TEXT DEFAULT NULL,
`RIGHTS` TEXT DEFAULT NULL,
`AUDIENCE` TEXT DEFAULT NULL,
`DIGITIZATION_SPECIFICATION` TEXT DEFAULT NULL,
`FILE_NAME` varchar(1000) DEFAULT NULL,
`DOC_TEXT` text,
`PBCORE_CREATOR` TEXT DEFAULT NULL,
`PBCORE_COVERAGE` varchar(20) DEFAULT NULL,
`PBCORE_RIGHTS_SUMMARY` TEXT DEFAULT NULL,
`PBCORE_EXTENSION` TEXT DEFAULT NULL,
`FILE_EXTENSION` text,
`URL_TEXT` TEXT DEFAULT NULL,
`LENGTH` TEXT DEFAULT NULL, */
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
INSERT INTO
    records_to_list_items (
        SELECT DISTINCT
            list_item_id,
            id AS record_id
        FROM
            freedom_archives_old.list_items_lookup a
            JOIN freedom_archives.list_items b ON a.item=b.item
            AND a.type=b.type
            JOIN records ON id=record_id
        WHERE
            is_doc=1
    );

INSERT INTO
    collections_to_list_items (
        SELECT DISTINCT
            list_item_id,
            id AS collection_id
        FROM
            freedom_archives_old.list_items_lookup a
            JOIN freedom_archives.list_items b ON a.item=b.item
            AND a.type=b.type
            JOIN collections ON id=collection_id
        WHERE
            is_doc=0
    );

/* instance_id serial PRIMARY KEY,
record_id integer NOT NULL REFERENCES records ON DELETE CASCADE,
is_primary bool DEFAULT false,
format TEXT DEFAULT NULL,
no_copies integer DEFAULT '1',
quality text,
url TEXT NOT NULL DEFAULT '',
thumbnail varchar(45) DEFAULT NULL,
media_type varchar(20) NOT NULL DEFAULT '',
creator_user_id integer REFERENCES users,
contributor_user_id integer REFERENCES users,
date_created timestamp DEFAULT NULL,
date_modified timestamp DEFAULT NULL,
original_doc_id integer DEFAULT NULL */
CREATE TABLE
    duplicate_relations AS
SELECT
    id
FROM
    freedom_archives_old.related_records
WHERE
    docid_1=docid_2
    AND title_1=title_2
    AND description_1=description_2
    AND track_number_1=track_number_2;

INSERT INTO
    instances (
        record_id,
        archive_id,
        call_number_id,
        call_number_suffix,
        format_id,
        no_copies,
        quality_id,
        generation_id,
        url,
        thumbnail,
        media_type,
        creator_user_id,
        contributor_user_id,
        date_created,
        date_modified,
        original_doc_id
    )
SELECT
    docid AS record_id,
    1,
    (
        SELECT
            list_item_id
        FROM
            list_items
        WHERE
            item=TRIM(SPLIT_PART(call_number, ' ', 1))
            AND
        TYPE='call_number'
    ),
    TRIM(
        SUBSTRING(
            call_number
            FROM
                '^[A-z\/]+ (.+)$'
        )
    ),
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
FROM
    freedom_archives_old.documents a
    LEFT JOIN users b ON LOWER(a.creator)=b.username
    LEFT JOIN users c ON LOWER(a.contributor)=c.username
    LEFT JOIN list_items format_lookup ON LOWER(a.format)=LOWER(format_lookup.item)
    AND format_lookup.type='format'
    LEFT JOIN list_items quality_lookup ON LOWER(a.quality)=LOWER(quality_lookup.item)
    AND quality_lookup.type='quality'
    LEFT JOIN list_items generation_lookup ON LOWER(a.generation)=LOWER(generation_lookup.item)
    AND generation_lookup.type='generation';

UPDATE records a
SET
    primary_instance_id=b.instance_id
FROM
    instances b
WHERE
    a.record_id=b.record_id;

DELETE FROM freedom_archives_old.related_records
WHERE
    docid_1 NOT IN (
        SELECT
            record_id
        FROM
            records
    )
    OR docid_2 NOT IN (
        SELECT
            record_id
        FROM
            records
    );

INSERT INTO
    instances (
        record_id,
        archive_id,
        call_number_id,
        call_number_suffix,
        format_id,
        no_copies,
        quality_id,
        generation_id,
        url,
        thumbnail,
        media_type,
        creator_user_id,
        contributor_user_id,
        date_created,
        date_modified,
        original_doc_id
    )
SELECT
    x.docid_1 AS record_id,
    1,
    (
        SELECT
            list_item_id
        FROM
            list_items
        WHERE
            item=TRIM(SPLIT_PART(a.call_number, ' ', 1))
            AND
        TYPE='call_number'
    ),
    TRIM(
        SUBSTRING(
            a.call_number
            FROM
                '^[A-z\/]+ (.+)$'
        )
    ),
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
FROM
    (
        SELECT
            docid_1,
            docid_2
        FROM
            freedom_archives_old.related_records
        WHERE
            REPLACE(title_1, 'Copy of ', '')=REPLACE(title_2, 'Copy of ', '')
            AND docid_1!=docid_2
            AND id NOT IN (
                SELECT
                    id
                FROM
                    duplicate_relations
            )
    ) x
    JOIN freedom_archives_old.documents a ON a.docid=x.docid_2
    LEFT JOIN users b ON LOWER(a.creator)=b.username
    LEFT JOIN users c ON LOWER(a.contributor)=c.username
    LEFT JOIN list_items format_lookup ON LOWER(a.format)=LOWER(format_lookup.item)
    AND format_lookup.type='format'
    LEFT JOIN list_items quality_lookup ON LOWER(a.quality)=LOWER(quality_lookup.item)
    AND quality_lookup.type='quality'
    LEFT JOIN list_items generation_lookup ON LOWER(a.generation)=LOWER(generation_lookup.item)
    AND generation_lookup.type='generation';

-- UPDATE instances
-- SET
--     call_number=NULL
-- WHERE
--     call_number=''
--     OR call_number='null';
-- UPDATE instances
-- SET
--     call_number=REPLACE(call_number, 'JG/', 'JG/LS')
-- WHERE
--     call_number LIKE 'JG/ %';
INSERT INTO
    config
SELECT
    1,
    setting,
    TO_JSON(VALUE)
FROM
    freedom_archives_old.config;