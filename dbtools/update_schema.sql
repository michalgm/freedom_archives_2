BEGIN;
-- CREATE TEMP TABLE parent_lookup as select record_id, parent_record_id from records where parent_record_id is not null;
-- select * from `parent_lookup`;

DROP SCHEMA IF EXISTS freedom_archives CASCADE;
CREATE schema freedom_archives;

-- select * from `parent_lookup`;
SET search_path to freedom_archives;
-- select * from parent_lookup;

CREATE TABLE archives (
  archive_id serial PRIMARY KEY,
  title text
);

CREATE TABLE users (
  user_id serial PRIMARY KEY,
  archive_id integer NOT NULL REFERENCES archives,
  username varchar(50) NOT NULL,
  firstname varchar(50) DEFAULT NULL,
  lastname varchar(50) DEFAULT NULL,
  user_type varchar(50) DEFAULT NULL,
  password varchar(200) DEFAULT NULL,
  status varchar(20) DEFAULT NULL,
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

CREATE TABLE list_items (
  list_item_id serial PRIMARY KEY,
item varchar(500) NOT NULL,
  type varchar(45) NOT NULL,
  description varchar(200) DEFAULT NULL
);
CREATE INDEX list_items_type_idx ON list_items (type);

CREATE TABLE collections (
  collection_id serial PRIMARY KEY,
  parent_collection_id integer DEFAULT null REFERENCES collections,
  collection_name varchar(255) DEFAULT NULL,
  description text,
  summary varchar(255) DEFAULT NULL,
  call_number text,
  publisher_id integer REFERENCES list_items,
  -- publisher text,
  notes text,
  thumbnail varchar(50) DEFAULT NULL,
  display_order integer NOT NULL DEFAULT 1000,
  needs_review bool DEFAULT false,
  is_hidden bool DEFAULT false,
  publish_to_global bool DEFAULT true,
  creator_user_id integer REFERENCES users,
  contributor_user_id integer REFERENCES users,
  date_created timestamptz DEFAULT NULL,
  date_modified timestamptz DEFAULT NULL
);

CREATE TABLE records (
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
  needs_review bool DEFAULT false,
  is_hidden bool DEFAULT false,
  publish_to_global bool DEFAULT true,
  creator_user_id integer REFERENCES users,
  contributor_user_id integer REFERENCES users,
  date_created timestamptz DEFAULT NULL,
  date_modified timestamptz DEFAULT NULL
);

CREATE TABLE instances (
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

CREATE INDEX instances_call_number on instances (call_number);
CREATE INDEX instances_format on instances (format);
CREATE INDEX instances_quality on instances (quality);
CREATE INDEX instances_generation on instances (generation);
CREATE INDEX instances_media_type on instances (media_type);

CREATE TABLE featured_records (
  record_id serial PRIMARY KEY REFERENCES records ON DELETE CASCADE,
  collection_id integer NOT NULL REFERENCES collections ON DELETE CASCADE,
  record_order integer DEFAULT NULL,
  label varchar(60) DEFAULT NULL
);

CREATE TABLE records_to_list_items (
  list_item_id integer not null REFERENCES list_items,
  record_id integer not null REFERENCES records ON DELETE CASCADE,
  PRIMARY KEY (list_item_id, record_id)
);

CREATE TABLE collections_to_list_items (
  list_item_id integer not null REFERENCES list_items,
  collection_id integer not null REFERENCES collections ON DELETE CASCADE,
  PRIMARY KEY (list_item_id, collection_id)
);

CREATE TABLE instances_to_list_items (
  list_item_id integer not null REFERENCES list_items,
  instance_id integer not null REFERENCES instances ON DELETE CASCADE,
  PRIMARY KEY (list_item_id, instance_id)
);


create table related_records as select * from freedom_archives_old.related_records;
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

insert into archives VALUES(default, 'The Freedom Archives');
insert into users (select user_id, 1, lower(username), firstname, lastname, user_type, password, status, email from freedom_archives_old.users);
insert into list_items(item, type, description) (select item, type, description from freedom_archives_old.list_items);
insert into list_items(item, type)
  (select distinct publisher,
                   'publisher'
   from
     (select publisher
      from freedom_archives_old.documents
      union select organization
      from freedom_archives_old.collections) a
   where publisher != ''
   order by publisher);


insert into collections (collection_id, collection_name, display_order) values (0, 'Uncategorized', 0);

insert into collections (
  select
    collection_id,
    parent_id,
    collection_name,
    a.description,
    summary,
    call_number,
    publisher_lookup.list_item_id,
    internal_notes as notes,
    thumbnail,
    display_order,
    needs_review::bool,
    is_hidden::bool,
    true,
    b.user_id as creator_user_id,
    c.user_id as contributor_user_id,
    null,
    date_modified
  from freedom_archives_old.collections a
  left join list_items publisher_lookup on a.organization = publisher_lookup.item and publisher_lookup.type = 'publisher'
  left join users b on a.creator = b.username
  left join users c on a.contributor = c.username);
/* FIXME: Call number relation */
/* FIXME: list_items missing stuff */
/* FIXME: year/month/day -> date field */
/* FIXME: normalize dates: select docid, a.year, a.month, a.day, b.year, b.month, b.day from freedom_archives_old.documents a join records_view b on docid = record_id where a.year != b.year::text or a.month != b.month::text or a.day != b.day::text; */

insert into records (
  select
    docid as record_id,
    1,
    title,
    a.description,
    notes,
    location,
    vol_number,
    case collection_id when 112 then 1000 else collection_id end,
    null,
    null,
    nullif(regexp_replace(year, '[^0-9]', '', 'g'), '')::int,
    nullif(regexp_replace(month, '[^0-9]', '', 'g'), '')::int,
    nullif(regexp_replace(day, '[^0-9]', '', 'g'), '')::int,
    publisher_lookup.list_item_id,
    program_lookup.list_item_id,
    needs_review::bool,
    is_hidden::bool,
    true,
    b.user_id as creator_user_id,
    c.user_id as contributor_user_id,
    date_created,
    date_modified
  from
    freedom_archives_old.documents a
    left join users b on a.creator = b.username
    left join users c on a.contributor = c.username
    left join list_items call_number_lookup on a.call_number = call_number_lookup.item and call_number_lookup.type = 'call_number'
    left join list_items publisher_lookup on a.publisher = publisher_lookup.item and publisher_lookup.type = 'publisher'
    left join list_items program_lookup on a.program = program_lookup.item and program_lookup.type = 'program'
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

update records set month = '1' where record_id in (select docid from freedom_archives_old.documents where month = 'Ja');
update records set month = '2' where record_id in (select docid from freedom_archives_old.documents where month = 'Fe');
update records set month = '3' where record_id in (select docid from freedom_archives_old.documents where month = 'Ma');
update records set month = '4' where record_id in (select docid from freedom_archives_old.documents where month = 'Ap');
update records set month = '5' where record_id in (select docid from freedom_archives_old.documents where month = 'Ma');
update records set month = '6' where record_id in (select docid from freedom_archives_old.documents where month = 'Ju');
update records set month = '7' where record_id in (select docid from freedom_archives_old.documents where month = 'Ju');
update records set month = '8' where record_id in (select docid from freedom_archives_old.documents where month = 'Au' or month = 'Ag');
update records set month = '9' where record_id in (select docid from freedom_archives_old.documents where month = 'Se');
update records set month = '10' where record_id in (select docid from freedom_archives_old.documents where month = 'Oc');
update records set month = '11' where record_id in (select docid from freedom_archives_old.documents where month = 'No');
update records set month = '12' where record_id in (select docid from freedom_archives_old.documents where month = 'De');

update records set day = 30 where month = 6 and day = 31;
update records set year = 2005 where record_id = 28007;
update records set year = year + 1900 where year > 20 and year < 99;
update records set year = year + 2000 where year < 20;

update records set year = null where year > 2020;

insert into records_to_list_items (select distinct list_item_id,
  id as record_id from freedom_archives_old.list_items_lookup a join freedom_archives.list_items b on a.item = b.item and a.type = b.type join records on id = record_id where is_doc = 1);

insert into collections_to_list_items (select distinct list_item_id, id as collection_id from freedom_archives_old.list_items_lookup a join freedom_archives.list_items b on a.item = b.item and a.type = b.type join collections on id = collection_id where is_doc = 0);


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

create table duplicate_relations as select id from freedom_archives_old.related_records where docid_1 = docid_2 and title_1 = title_2 and description_1 = description_2 and track_number_1 = track_number_2;


insert into instances (record_id, call_number, format, no_copies, quality, generation, url, thumbnail, media_type, creator_user_id, contributor_user_id, date_created, date_modified, original_doc_id )
  select
    docid as record_id,
    call_number,
    format_lookup.list_item_id,
    no_copies,
    quality_lookup.list_item_id,
    generation_lookup.list_item_id,
    url,
    thumbnail,
    media_type,
    b.user_id as creator_user_id,
    c.user_id as contributor_user_id,
    date_created,
    date_modified,
    docid
  from
    freedom_archives_old.documents a
    left join users b on a.creator = b.username
    left join users c on a.contributor = c.username
    left join list_items format_lookup on a.format = format_lookup.item and format_lookup.type = 'format'
    left join list_items quality_lookup on a.quality = quality_lookup.item and quality_lookup.type = 'quality'
    left join list_items generation_lookup on a.generation = generation_lookup.item and generation_lookup.type = 'generation'
;

update records a set primary_instance_id = b.instance_id from instances b where a.record_id = b.record_id;

insert into instances (record_id, call_number, format, no_copies, quality, generation, url, thumbnail, media_type, creator_user_id, contributor_user_id, date_created, date_modified, original_doc_id )
  select
    x.docid_1 as record_id,
    a.call_number as call_number,
    format_lookup.list_item_id,
    no_copies,
    quality_lookup.list_item_id,
    generation_lookup.list_item_id,
    url,
    thumbnail,
    media_type,
    b.user_id as creator_user_id,
    c.user_id as contributor_user_id,
    date_created,
    date_modified,
    x.docid_2
  from
    (
      select docid_1, docid_2
      from freedom_archives_old.related_records
      where replace(title_1, 'Copy of ', '') = replace(title_2, 'Copy of ', '')
        and docid_1 != docid_2
        and id not in (select id from duplicate_relations)
    ) x
    join freedom_archives_old.documents a on a.docid = x.docid_2
    left join users b on a.creator = b.username
    left join users c on a.contributor = c.username
    left join list_items format_lookup on a.format = format_lookup.item
      and format_lookup.type = 'format'
    left join list_items quality_lookup on a.quality = quality_lookup.item
      and quality_lookup.type = 'quality'
    left join list_items generation_lookup on a.generation = generation_lookup.item and generation_lookup.type = 'generation'
;

drop view if exists instances_view;
create view instances_view as
  select
    a.*,
    jsonb_build_object('item', format_lookup.item, 'list_item_id', format_lookup.list_item_id) as format_item,
    jsonb_build_object('item', quality_lookup.item, 'list_item_id', quality_lookup.list_item_id) as quality_item,
    jsonb_build_object('item', generation_lookup.item, 'list_item_id', generation_lookup.list_item_id) as generation_item,
    contributor.firstname || ' ' || contributor.lastname as contributor_name,
    contributor.username as contributor_username,
    creator.firstname || ' ' || creator.lastname as creator_name,
    creator.username as creator_username,
    exists(select record_id from records where instance_id = records.primary_instance_id) as is_primary
  from instances a
    left join list_items format_lookup on format = format_lookup.list_item_id
    left join list_items quality_lookup on quality = quality_lookup.list_item_id
    left join list_items generation_lookup on generation = generation_lookup.list_item_id
    left join users contributor on a.contributor_user_id = contributor.user_id
    left join users creator on a.creator_user_id = creator.user_id
;

drop view if exists records_list_items_view;
create view records_list_items_view as
SELECT b.record_id,
    a.type,
    array_to_json(
      array_agg(
        ROW_TO_JSON(
          (select i from (select a.list_item_id, a.item) i )
        ) order by item
      )
    )::jsonb AS items,
    string_agg(a.item, ' ' order by a.item) as items_text,
    array_agg(a.item order by a.item) as items_search
   FROM list_items a
     JOIN records_to_list_items b USING (list_item_id)
  GROUP BY b.record_id, a.type;

drop view if exists collections_list_items_view;
create view collections_list_items_view as
SELECT b.collection_id,
    a.type,
    array_to_json(
      array_agg(
        ROW_TO_JSON(
          (select i from (select a.list_item_id, a.item) i )
        ) order by item
      )
    )::jsonb AS items,
    string_agg(a.item, ' ' order by a.item) as items_text,
    array_agg(a.item order by a.item) as items_search
   FROM list_items a
     JOIN collections_to_list_items b USING (list_item_id)
  GROUP BY b.collection_id, a.type;

drop view if exists collection_summaries;
create view collection_summaries AS
  SELECT a.collection_id,
    a.collection_name,
    a.parent_collection_id,
    a.thumbnail,
    a.call_number,
    COALESCE((select row_to_json(c) from (select collection_id, collection_name, thumbnail, parent_collection_id, call_number from collections c where a.parent_collection_id = c.collection_id ) c), '{}') as parent
  FROM collections a;

drop view if exists collections_view;
create view collections_view as
  select a.*,
    contributor.firstname || ' ' || contributor.lastname as contributor_name,
    contributor.username as contributor_username,
    creator.firstname || ' ' || creator.lastname as creator_name,
    creator.username as creator_username,
    jsonb_build_object('item', publisher_lookup.item, 'list_item_id', publisher_lookup.list_item_id) as publisher,
    COALESCE(subjects.items, '[]') as subjects,
    COALESCE(keywords.items, '[]') as keywords,
    subjects.items_text as subjects_text,
    keywords.items_text as keywords_text,
    subjects.items_search as subjects_search,
    keywords.items_search as keywords_search
  FROM collections a
  left join list_items publisher_lookup on a.publisher_id = publisher_lookup.list_item_id
  left join users contributor on a.contributor_user_id = contributor.user_id
  left join users creator on a.creator_user_id = creator.user_id
  left join collections_list_items_view subjects on subjects.type = 'subject' and subjects.collection_id = a.collection_id
  left join collections_list_items_view keywords on keywords.type = 'keyword' and keywords.collection_id = a.collection_id;

drop table if exists _unified_collections cascade;
create table _unified_collections as select * from collections_view;
-- CREATE INDEX collections_fulltext_index on unified_collections using GIN (fulltext);
ALTER TABLE _unified_collections add PRIMARY KEY(collection_id);

create or replace view unified_collections as 
  select a.*,
  COALESCE((select row_to_json(p) from collection_summaries p where a.parent_collection_id = p.collection_id), '{}') as parent,
  array(select row_to_json(collection_summaries) from collection_summaries where collection_summaries.parent_collection_id = a.collection_id) as children
  FROM _unified_collections a
  left join collection_summaries b using (collection_id);

drop view if exists record_summaries;
create view record_summaries AS
  SELECT a.record_id,
    a.title,
    a.parent_record_id,
    primary_instance.thumbnail as primary_instance_thumbnail,
    primary_instance.format as primary_instance_format,
    list_items.item as primary_instance_format_text,
    primary_instance.media_type as primary_instance_media_type,
    COALESCE((select row_to_json(c) from collection_summaries c where a.collection_id = c.collection_id), '{}') as collection
  FROM records a 
  left join instances primary_instance on a.primary_instance_id = primary_instance.instance_id
  left join list_items on primary_instance.format = list_items.list_item_id and list_items.type = 'format';

/* FIXME collection */
drop view if exists records_view;
create view records_view as
  select a.*,
    -- b.primary_instance_thumbnail,
    -- b.primary_instance_format,
    -- b.primary_instance_format_text,
    -- b.primary_instance_media_type,
    -- b.collection,
    coalesce(a.month::text, '??') || '/' || coalesce(a.day::text, '??') || '/' || coalesce(a.year::text, '??') as date_string,
    (coalesce(a.year::text, '1900')::text || '-' || coalesce(a.month::text, '01')::text || '-' || coalesce(a.day::text, '01')::text)::date as date,
    jsonb_build_object('item', publisher_lookup.item, 'list_item_id', publisher_lookup.list_item_id) as publisher,
    jsonb_build_object('item', program_lookup.item, 'list_item_id', program_lookup.list_item_id) as program,
    instances.instances as instances,
    instances.has_digital as has_digital,
    instances.instance_count as instance_count,
    contributor.firstname || ' ' || contributor.lastname as contributor_name,
    contributor.username as contributor_username,
    creator.firstname || ' ' || creator.lastname as creator_name,
    creator.username as creator_username,
    array(select distinct call_number from instances where instances.record_id = a.record_id and call_number is not null) as call_numbers,
    array(select distinct format from instances where instances.record_id = a.record_id and format is not null) as formats,
    array(select distinct quality from instances where instances.record_id = a.record_id and quality is not null) as qualitys,
    array(select distinct generation from instances where instances.record_id = a.record_id and generation is not null) as generations,
    array(select distinct media_type from instances where instances.record_id = a.record_id and media_type is not null) as media_types,
    coalesce(authors.items, '[]') as authors,
    coalesce(subjects.items, '[]') as subjects,
    coalesce(keywords.items, '[]') as keywords,
    coalesce(producers.items, '[]') as producers,
    authors.items_text as authors_text,
    subjects.items_text as subjects_text,
    keywords.items_text as keywords_text,
    producers.items_text as producers_text,
    authors.items_search as authors_search,
    subjects.items_search as subjects_search,
    keywords.items_search as keywords_search,
    producers.items_search as producers_search,
    setweight(to_tsvector('english', coalesce(a.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(a.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(authors.items_text, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(subjects.items_text, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(keywords.items_text, '')), 'C') as fulltext
    -- array(select distinct call_number from instances where instances.record_id = a.record_id and call_number is not null) as call_numbers,
    -- array(select distinct format from instances where instances.record_id = a.record_id and format is not null) as formats,
    -- array(select distinct quality from instances where instances.record_id = a.record_id and quality is not null) as qualitys,
    -- array(select distinct generation from instances where instances.record_id = a.record_id and generation is not null) as generations,
    -- array(select distinct media_type from instances where instances.record_id = a.record_id and media_type is not null) as media_types
    -- array(select row_to_json(record_summaries) from record_summaries where record_summaries.parent_record_id = a.record_id) as children,
    -- array(select row_to_json(record_summaries) from record_summaries where record_summaries.parent_record_id = a.parent_record_id and record_summaries.record_id != a.record_id) as siblings,
    -- (select row_to_json(parent) from record_summaries parent where a.parent_record_id = parent.record_id) as parent
  from records a
  -- left join record_summaries b using (record_id)
  -- left join record_summaries parent on a.parent_record_id = parent.record_id
  left join list_items publisher_lookup on a.publisher_id = publisher_lookup.list_item_id
  left join list_items program_lookup on a.program_id = program_lookup.list_item_id
  left join 
    (select record_id,
      bool_or(url != '') as has_digital,
      count(*) as instance_count,
      array_to_json(array_agg(row_to_json(b)
      order by b.is_primary desc, b.instance_id)) as instances
      from instances_view b
      group by record_id
    ) instances using (record_id)
  left join instances primary_instance on a.primary_instance_id = primary_instance.instance_id
  left join users contributor on a.contributor_user_id = contributor.user_id
  left join users creator on a.creator_user_id = creator.user_id
  -- left join (select parent_record_id, array_to_json(array_agg(row_to_json(b))) as children from (select parent_record_id, record_id, title from records) b group by parent_record_id) children on children.parent_record_id = a.record_id

-- left join
--   (select parent_record_id,
--           array_to_json(array_agg(row_to_json(b))) as siblings
--    from
--      (select parent_record_id,
--              record_id,
--              title
--       from records) b
--    group by parent_record_id) siblings on siblings.parent_record_id = a.parent_record_id
  left join records_list_items_view authors on authors.type = 'author' and authors.record_id = a.record_id
  left join records_list_items_view subjects on subjects.type = 'subject' and subjects.record_id = a.record_id
  left join records_list_items_view keywords on keywords.type = 'keyword' and keywords.record_id = a.record_id
  left join records_list_items_view producers on producers.type = 'producer' and producers.record_id = a.record_id
  -- left join records parent on a.parent_record_id = parent.record_id
  ;

drop table if exists _unified_records cascade;
create table _unified_records as select * from records_view;
CREATE INDEX records_fulltext_index on _unified_records using GIN (fulltext);
CREATE INDEX records_year on _unified_records (year);
CREATE INDEX records_title on _unified_records (title);
CREATE INDEX records_has_digital on _unified_records (has_digital);
CREATE INDEX records_collection_id on _unified_records (collection_id);
-- CREATE INDEX records_keywords_text on _unified_records (keywords_text);
-- CREATE INDEX records_subjects_text on _unified_records (subjects_text);
-- CREATE INDEX records_authors_text on _unified_records (authors_text);
-- CREATE INDEX records_producers_text on _unified_records (producers_text);
CREATE INDEX records_parent_record_id on _unified_records (parent_record_id);
CREATE INDEX records_call_numbers on _unified_records using GIN (call_numbers);
CREATE INDEX records_authors_search on _unified_records using GIN (authors_search);
CREATE INDEX records_subjects_search on _unified_records using GIN (subjects_search);
CREATE INDEX records_keywords_search on _unified_records using GIN (keywords_search);
CREATE INDEX records_producers_search on _unified_records using GIN (producers_search);
ALTER TABLE _unified_records add PRIMARY KEY(record_id);

create or replace view unified_records as 
  select a.*,
  b.primary_instance_thumbnail,
  b.primary_instance_format,
  b.primary_instance_format_text,
  b.primary_instance_media_type,
  b.collection,
  array(select row_to_json(record_summaries) from record_summaries where record_summaries.parent_record_id = a.record_id) as children,
  array(select row_to_json(record_summaries) from record_summaries where record_summaries.parent_record_id = a.parent_record_id and record_summaries.record_id != a.record_id) as siblings,
  COALESCE((select row_to_json(parent) from record_summaries parent where a.parent_record_id = parent.record_id), '{}') as parent
  -- (select parent from record_summaries parent where a.parent_record_id = parent.record_id) as parent,
  from _unified_records a
  left join record_summaries b using (record_id);
  
drop table if exists unknown_relations;

create table unknown_relations as
  select related_records.*,
      '' as type,
      '' as notes,
      '' as "user",
      NULL::timestamptz as updated_at, 
      c.call_number as call_number_1,
      d.call_number as call_number_2,
      c.generation as generation_1,
      d.generation as generation_2,
      c.format as format_1,
      d.format as format_2
    from related_records
    join records a on docid_1 = a.record_id
    join records b on docid_2 = b.record_id
    join freedom_archives_old.documents c on docid_1 = c.docid
    join freedom_archives_old.documents d on docid_2 = d.docid

    where replace(title_1, 'Copy of ', '') != replace(title_2, 'Copy of ', '')
      and docid_1 != docid_2
      and id not in (select id from duplicate_relations)
    order by docid_1;

drop table if exists parent_lookup;

COMMIT;