DROP SCHEMA IF EXISTS freedom_archives CASCADE;

DROP SCHEMA IF EXISTS public_search CASCADE;

CREATE SCHEMA freedom_archives;

SET
    search_path TO freedom_archives;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

SET
    search_path TO freedom_archives;

CREATE TABLE
    archives (archive_id serial PRIMARY KEY, title TEXT);

CREATE TYPE user_role AS ENUM('intern', 'staff', 'administrator');

CREATE TABLE
    users (
        user_id serial PRIMARY KEY,
        archive_id INTEGER NOT NULL REFERENCES archives,
        username TEXT NOT NULL UNIQUE,
        firstname TEXT DEFAULT NULL,
        lastname TEXT DEFAULT NULL,
        "role" user_role DEFAULT NULL,
        "password" TEXT DEFAULT NULL,
        active BOOLEAN DEFAULT FALSE,
        email TEXT DEFAULT NULL,
        full_name TEXT GENERATED ALWAYS AS (TRIM(firstname||' '||lastname)) STORED,
        user_search TEXT GENERATED ALWAYS AS (
            TRIM(
                username||' '||firstname||' '||lastname||' '||email
            )
        ) STORED
    );

CREATE TABLE
    list_items (
        list_item_id serial PRIMARY KEY,
        archive_id INTEGER REFERENCES archives ON DELETE CASCADE,
        item TEXT NOT NULL,
        fulltext tsvector GENERATED ALWAYS AS (TO_TSVECTOR('english', COALESCE(item::TEXT, ''))) STORED,
        search_text TEXT GENERATED ALWAYS AS (LOWER(COALESCE(item::TEXT, ''))) STORED,
        TYPE TEXT NOT NULL,
        description TEXT DEFAULT NULL
    );

CREATE UNIQUE INDEX list_items_type_idx ON list_items (
    TYPE,
    item,
    archive_id
);

CREATE INDEX list_items_fulltext_idx ON list_items USING GIN (fulltext);

CREATE INDEX list_items_search_text_idx ON list_items (search_text);

CREATE TABLE
    collections (
        collection_id serial PRIMARY KEY,
        archive_id INTEGER REFERENCES archives ON DELETE CASCADE,
        parent_collection_id INTEGER DEFAULT NULL REFERENCES collections ON DELETE SET NULL,
        collection_name TEXT DEFAULT NULL,
        description TEXT,
        description_search TEXT,
        summary TEXT DEFAULT NULL,
        call_number_id INTEGER REFERENCES list_items ON DELETE SET NULL,
        call_number_suffix TEXT,
        publisher_id INTEGER REFERENCES list_items ON DELETE SET NULL,
        -- publisher text,
        notes TEXT,
        thumbnail TEXT DEFAULT NULL,
        display_order INTEGER NOT NULL DEFAULT 1000,
        date_range TEXT DEFAULT NULL,
        needs_review bool DEFAULT FALSE,
        is_hidden bool DEFAULT FALSE,
        creator_user_id INTEGER REFERENCES users,
        contributor_user_id INTEGER REFERENCES users,
        date_created timestamptz DEFAULT NULL,
        date_modified timestamptz DEFAULT NULL
    );

CREATE INDEX collections_parent_collection_id_idx ON collections (parent_collection_id);

CREATE INDEX collections_archive_id_idx ON collections (archive_id);

CREATE INDEX collections_call_number_id_idx ON collections (call_number_id);

CREATE INDEX collection_display_order_idx ON collections (display_order);

CREATE TABLE
    records (
        record_id serial PRIMARY KEY,
        archive_id INTEGER NOT NULL REFERENCES archives ON DELETE CASCADE,
        title TEXT,
        description TEXT,
        notes TEXT,
        "location" TEXT DEFAULT NULL,
        vol_number TEXT DEFAULT NULL,
        collection_id INTEGER DEFAULT 1000 REFERENCES collections ON DELETE SET DEFAULT,
        parent_record_id INTEGER,
        primary_instance_id INTEGER,
        "year" INT,
        "month" INT,
        "day" INT,
        year_is_circa BOOLEAN DEFAULT FALSE,
        publisher_id INTEGER REFERENCES list_items ON DELETE SET NULL,
        program_id INTEGER REFERENCES list_items ON DELETE SET NULL,
        needs_review bool DEFAULT FALSE,
        is_hidden bool DEFAULT FALSE,
        creator_user_id INTEGER REFERENCES users,
        contributor_user_id INTEGER REFERENCES users,
        date_created timestamptz DEFAULT NULL,
        date_modified timestamptz DEFAULT NULL
    );

CREATE INDEX records_parent_record_id_idx ON records (parent_record_id);

CREATE INDEX records_collection_id_idx ON records (collection_id);

CREATE INDEX records_primary_instance_id_idx ON records (primary_instance_id);

CREATE INDEX records_archive_id_idx ON records (archive_id);

CREATE TABLE
    instances (
        instance_id serial PRIMARY KEY,
        archive_id INTEGER REFERENCES archives ON DELETE CASCADE,
        call_number_id INTEGER REFERENCES list_items ON DELETE SET NULL,
        call_number_suffix TEXT,
        record_id INTEGER NOT NULL REFERENCES records ON DELETE CASCADE,
        -- is_primary bool DEFAULT false,
        format_id INTEGER REFERENCES list_items ON DELETE SET NULL,
        no_copies INTEGER DEFAULT '1',
        quality_id INTEGER REFERENCES list_items ON DELETE SET NULL,
        generation_id INTEGER REFERENCES list_items ON DELETE SET NULL,
        url TEXT NOT NULL DEFAULT '',
        thumbnail TEXT DEFAULT NULL,
        media_type TEXT NOT NULL DEFAULT '',
        creator_user_id INTEGER REFERENCES users,
        contributor_user_id INTEGER REFERENCES users,
        date_created timestamptz DEFAULT NULL,
        date_modified timestamptz DEFAULT NULL,
        original_doc_id INTEGER DEFAULT NULL
    );

CREATE INDEX instances_call_number_suffix ON instances (call_number_suffix);

CREATE INDEX instances_call_number_id ON instances (call_number_id);

CREATE INDEX instances_format ON instances (format_id);

CREATE INDEX instances_quality ON instances (quality_id);

CREATE INDEX instances_generation ON instances (generation_id);

CREATE INDEX instances_media_type ON instances (media_type);

CREATE TABLE
    featured_records (
        record_id INTEGER NOT NULL REFERENCES records ON DELETE CASCADE,
        archive_id INTEGER NOT NULL REFERENCES archives ON DELETE CASCADE,
        collection_id INTEGER NOT NULL REFERENCES collections ON DELETE CASCADE,
        record_order INTEGER NOT NULL DEFAULT NULL,
        LABEL TEXT DEFAULT NULL
    );

CREATE UNIQUE INDEX featured_records_idx ON featured_records (archive_id, collection_id, record_id);

CREATE TABLE
    records_to_list_items (
        list_item_id INTEGER NOT NULL REFERENCES list_items ON DELETE CASCADE,
        record_id INTEGER NOT NULL REFERENCES records ON DELETE CASCADE,
        PRIMARY KEY (list_item_id, record_id)
    );

CREATE TABLE
    collections_to_list_items (
        list_item_id INTEGER NOT NULL REFERENCES list_items ON DELETE CASCADE,
        collection_id INTEGER NOT NULL REFERENCES collections ON DELETE CASCADE,
        PRIMARY KEY (list_item_id, collection_id)
    );

CREATE TABLE
    instances_to_list_items (
        list_item_id INTEGER NOT NULL REFERENCES list_items ON DELETE CASCADE,
        instance_id INTEGER NOT NULL REFERENCES instances ON DELETE CASCADE,
        PRIMARY KEY (list_item_id, instance_id)
    );

CREATE TABLE
    continuations (
        continuation_id serial PRIMARY KEY,
        continuation_records INTEGER[]
    );

CREATE TABLE
    related_records AS
SELECT
    *
FROM
    freedom_archives_old.related_records;

CREATE TABLE
    config (
        archive_id INTEGER NOT NULL REFERENCES archives,
        setting TEXT NOT NULL,
        VALUE jsonb DEFAULT '""'
    );

CREATE INDEX settings_key ON config (archive_id, setting);