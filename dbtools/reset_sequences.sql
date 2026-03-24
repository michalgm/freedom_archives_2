-- For records table
SELECT setval('records_record_id_seq', (SELECT MAX(record_id) FROM records));

-- For media table
SELECT setval('media_media_id_seq', (SELECT MAX(media_id) FROM media));

-- For collections table
SELECT setval('collections_collection_id_seq', (SELECT MAX(collection_id) FROM collections));

-- For list_items table
SELECT setval('list_items_list_item_id_seq', (SELECT MAX(list_item_id) FROM list_items));

-- For media table
SELECT setval('media_media_id_seq', (SELECT MAX(media_id) FROM media));
