DROP SCHEMA IF EXISTS freedom_archives CASCADE;
CREATE schema freedom_archives;

SET search_path to freedom_archives;

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

CREATE TABLE collections (
  collection_id serial PRIMARY KEY,
  parent_id integer DEFAULT null REFERENCES collections,
  collection_name varchar(255) DEFAULT NULL,
  description text,
  summary varchar(255) DEFAULT NULL,
  call_number text,
  publisher text,
  notes text,
  thumbnail varchar(50) DEFAULT NULL,
  display_order integer NOT NULL DEFAULT 1000,
  needs_review bool DEFAULT false,
  is_hidden bool DEFAULT false,
  publish_to_global bool DEFAULT true,
  creator_user_id integer REFERENCES users,
  contributor_user_id integer REFERENCES users,
  date_created timestamp DEFAULT NULL,
  date_modified timestamp DEFAULT NULL
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
  item varchar(200) NOT NULL,
  type varchar(45) NOT NULL,
  description varchar(200) DEFAULT NULL
);
CREATE INDEX list_items_type_idx ON list_items (type);


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
  year int,
  month int,
  day int,
  call_number text,
  publisher integer REFERENCES list_items,
  program integer REFERENCES list_items,
  needs_review bool DEFAULT false,
  is_hidden bool DEFAULT false,
  publish_to_global bool DEFAULT true,
  creator_user_id integer REFERENCES users,
  contributor_user_id integer REFERENCES users,
  date_created timestamp DEFAULT NULL,
  date_modified timestamp DEFAULT NULL
);

CREATE TABLE instances (
  instance_id serial PRIMARY KEY,
  record_id integer NOT NULL REFERENCES records ON DELETE CASCADE,
  is_primary bool DEFAULT false,
  format integer REFERENCES list_items,
  no_copies integer DEFAULT '1',
  quality integer REFERENCES list_items,
  generation integer REFERENCES list_items,
  url varchar(255) NOT NULL DEFAULT '',
  thumbnail varchar(45) DEFAULT NULL,
  media_type varchar(20) NOT NULL DEFAULT '',
  creator_user_id integer REFERENCES users,
  contributor_user_id integer REFERENCES users,
  date_created timestamp DEFAULT NULL,
  date_modified timestamp DEFAULT NULL,
  original_doc_id integer DEFAULT NULL
);

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
insert into collections (collection_id, collection_name, display_order) values (0, 'Uncategorized', 0);

insert into collections (select collection_id, parent_id, collection_name, description, summary, call_number, organization as publisher, internal_notes as notes, thumbnail, display_order, needs_review::bool, is_hidden::bool, true, b.user_id as creator_user_id, c.user_id as contributor_user_id, null, date_modified from freedom_archives_old.collections a left join users b on a.creator = b.username left join users c on a.contributor = c.username);
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
    nullif(regexp_replace(year, '[^0-9]', '', 'g'), '')::int,
    nullif(regexp_replace(month, '[^0-9]', '', 'g'), '')::int,
    nullif(regexp_replace(day, '[^0-9]', '', 'g'), '')::int,
    call_number,
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


insert into instances (record_id, is_primary, format, no_copies, quality, generation, url, thumbnail, media_type, creator_user_id, contributor_user_id, date_created, date_modified, original_doc_id )
  select
    docid as record_id,
    true,
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

insert into instances (record_id, is_primary, format, no_copies, quality, generation, url, thumbnail, media_type, creator_user_id, contributor_user_id, date_created, date_modified, original_doc_id )
  select
    x.docid_1 as record_id,
    false,
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
    format_lookup.item as format_value,
    quality_lookup.item as quality_value,
    generation_lookup.item as generation_value,
    contributor.firstname || ' ' || contributor.lastname as contributor_name,
    contributor.username as contributor_username,
    creator.firstname || ' ' || creator.lastname as creator_name,
    creator.username as creator_username
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
    ) AS items,
    string_agg(a.item, ' ' order by a.item) as items_text,
    array_agg(a.item order by a.item) as items_search
   FROM list_items a
     JOIN records_to_list_items b USING (list_item_id)
  GROUP BY b.record_id, a.type;

/* FIXME collection */
drop view if exists records_view;
create view records_view as
  select a.*,
    coalesce(a.month::text, '??') || '/' || coalesce(a.day::text, '??') || '/' || coalesce(a.year::text, '??') as date_string,
    (coalesce(a.year::text, '1900')::text || '-' || coalesce(a.month::text, '01')::text || '-' || coalesce(a.day::text, '01')::text)::date as date,
    collections.collection_name as collection_value,
    publisher_lookup.item as publisher_value,
    program_lookup.item as program_value,
    instances.instances as instances,
    instances.has_digital as has_digital,
    instances.instance_count as instance_count,
    contributor.firstname || ' ' || contributor.lastname as contributor_name,
    contributor.username as contributor_username,
    creator.firstname || ' ' || creator.lastname as creator_name,
    creator.username as creator_username,
    coalesce(children.children, '[]'::json) as children,
    jsonb_build_object('title', parent.title, 'record_id', parent.record_id) as parent,
    authors.items as authors,
    subjects.items as subjects,
    keywords.items as keywords,
    producers.items as producers,
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
  from records a
  left join collections using(collection_id)
  left join list_items publisher_lookup on a.publisher = publisher_lookup.list_item_id
  left join list_items program_lookup on a.program = program_lookup.list_item_id
  left join (select record_id, bool_or(url != '') as has_digital, count(*) as instance_count, array_to_json(array_agg(row_to_json(b) order by b.is_primary)) as instances from instances_view b group by record_id ) instances using (record_id)
  left join users contributor on a.contributor_user_id = contributor.user_id
  left join users creator on a.creator_user_id = creator.user_id
  left join (select parent_record_id, array_to_json(array_agg(row_to_json(b))) as children from (select parent_record_id, record_id, title from records) b group by parent_record_id) children on children.parent_record_id = a.record_id
  left join records_list_items_view authors on authors.type = 'author' and authors.record_id = a.record_id
  left join records_list_items_view subjects on subjects.type = 'subject' and subjects.record_id = a.record_id
  left join records_list_items_view keywords on keywords.type = 'keyword' and keywords.record_id = a.record_id
  left join records_list_items_view producers on producers.type = 'producer' and producers.record_id = a.record_id
  left join records parent on a.parent_record_id = parent.record_id
  ;
drop table if exists unified_records cascade;
create table unified_records as select * from records_view;
CREATE INDEX records_fulltext_index on unified_records using GIN (fulltext);
ALTER TABLE unified_records add PRIMARY KEY(record_id);

drop table if exists unknown_relations;

create table unknown_relations as
  select related_records.*,
      '' as type,
      '' as notes,
      a.call_number as call_number_1,
      b.call_number as call_number_2,
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
