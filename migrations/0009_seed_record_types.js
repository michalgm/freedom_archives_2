export const up = async function (knex) {
  await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
  await knex.raw(`

INSERT INTO freedom_archives.format_record_types VALUES (2293, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2294, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2296, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2297, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2298, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2299, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2300, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2301, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2302, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2303, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2304, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2305, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2306, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2307, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2308, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2309, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2310, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2311, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2312, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2314, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2315, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2316, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2318, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (3172, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2319, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2320, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (3438, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2321, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2322, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2323, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2324, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2325, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2326, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2327, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2330, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2331, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2332, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2333, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (4836, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2334, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2335, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2259, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2338, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2339, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2340, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2341, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2342, 'Other');
INSERT INTO freedom_archives.format_record_types VALUES (6536, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2343, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2344, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2345, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2346, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2349, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (7081, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2350, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2351, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2352, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2354, 'Other');
INSERT INTO freedom_archives.format_record_types VALUES (2265, 'Other');
INSERT INTO freedom_archives.format_record_types VALUES (2356, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2357, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2358, 'Other');
INSERT INTO freedom_archives.format_record_types VALUES (2359, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2360, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (8175, 'Other');
INSERT INTO freedom_archives.format_record_types VALUES (23481, 'Other');
INSERT INTO freedom_archives.format_record_types VALUES (2362, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2363, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2364, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (8213, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2365, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (8215, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2366, 'Other');
INSERT INTO freedom_archives.format_record_types VALUES (2367, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2369, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (11186, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (11253, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2371, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2372, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (11293, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2373, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2374, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2375, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2376, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2377, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2379, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2380, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2381, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (12723, 'Other');
INSERT INTO freedom_archives.format_record_types VALUES (2383, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (12726, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (12732, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2385, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2386, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2387, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2390, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2391, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2392, 'Image');
INSERT INTO freedom_archives.format_record_types VALUES (2393, 'Image');
INSERT INTO freedom_archives.format_record_types VALUES (2394, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2395, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2396, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (14059, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2397, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2399, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2401, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2402, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2403, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2404, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2405, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2406, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2407, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2408, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (15629, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2409, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2410, 'Image');
INSERT INTO freedom_archives.format_record_types VALUES (2411, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (16382, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2412, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2413, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2414, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2415, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2416, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2417, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2418, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2419, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (2420, 'Video');
INSERT INTO freedom_archives.format_record_types VALUES (17634, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (2421, 'Audio');
INSERT INTO freedom_archives.format_record_types VALUES (18266, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2422, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (23420, 'Website');
INSERT INTO freedom_archives.format_record_types VALUES (2236, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (23701, 'Document');
INSERT INTO freedom_archives.format_record_types VALUES (2295, 'Audio');
    `);

  await knex.raw(`alter table public_search.collections alter column featured_records type jsonb;`);
  await knex.raw(`alter table collections_snapshots alter column featured_records type jsonb;`);

  await knex.raw(`UPDATE public_search.records pr
SET record_type = r.record_type
FROM freedom_archives._unified_records r
WHERE r.record_id = pr.record_id`);

  await knex.raw(`UPDATE public_search.records pr
SET record_type = r.record_type
FROM freedom_archives.list_items li 
JOIN freedom_archives.format_record_types r ON r.list_item_id = li.list_item_id
WHERE li.item = pr.format`);

  await knex.raw(`UPDATE records_snapshots rs
SET record_type = r.record_type
FROM freedom_archives.list_items li 
JOIN freedom_archives.format_record_types r ON r.list_item_id = li.list_item_id
WHERE li.item = rs.format`);

  await knex.raw(`UPDATE public_search.collections c
SET featured_records = (
  SELECT jsonb_agg(
    (elem - 'primary_media_media_type') ||
    jsonb_build_object('record_type', frt.record_type)
    ORDER BY (elem->>'record_order')::int
  )
  FROM jsonb_array_elements(c.featured_records) AS elem
  LEFT JOIN freedom_archives.format_record_types frt
    ON frt.list_item_id = (elem->>'format_id')::int
)
WHERE featured_records IS NOT NULL;`);

  await knex.raw(`UPDATE collections_snapshots c
SET featured_records = (
  SELECT jsonb_agg(
    (elem - 'primary_media_media_type') ||
    jsonb_build_object('record_type', frt.record_type)
    ORDER BY (elem->>'record_order')::int
  )
  FROM jsonb_array_elements(c.featured_records) AS elem
  LEFT JOIN freedom_archives.format_record_types frt
    ON frt.list_item_id = (elem->>'format_id')::int
)
WHERE featured_records IS NOT NULL;`);

  await knex.raw(`
DELETE FROM _unified_records;
INSERT INTO _unified_records SELECT * FROM unified_records;
`);
  await knex.raw(`
DELETE FROM _unified_collections;
INSERT INTO _unified_collections SELECT * FROM unified_collections;
    `);
};

export const down = async function (knex) {};
