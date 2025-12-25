import { promises } from "fs";
import lodash from 'lodash';

import app from '../app.js';
import { updateThumbnail } from '../services/common_hooks/thumbnailer.js';

const fs = { promises }.promises;
const { get } = lodash;

function printProgress(progress) {
  if (process.stdout.clearLine) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }
  process.stdout.write(progress + '% ');
}

const types = {
  records: {
    path: 'media[0].url',
    query: {
      primary_media_thumbnail: { $ne: "" },
      $select: ['record_id', 'primary_media_thumbnail', 'media'],
      // record_id: 39214,
      // primary_media_media_type: { $in: ['Video', 'Image', 'PDF'] },
    },
  },
  collections: {
    path: 'thumbnail',
    query: {
      thumbnail: { $ne: "" },
      $select: ['collection_id', 'thumbnail'],
    },
  },
};

/**
 * Optimized version that uses single transaction per batch and parallel processing
 * This version keeps the full updateThumbnail hook functionality (media type detection, etc.)
 */
async function updateThumbnailsWithHook(serviceName = 'records') {
  const batchSize = 50; // Smaller batches for better transaction management
  const concurrency = 3; // Conservative concurrency for hook processing
  let offset = 0;
  let totalUpdated = 0;
  let total = 0;

  try {
    while (true) {
      const { data: items, total: totalItems } = await app.service(`api/unified_${serviceName}`).find({
        query: {
          $limit: batchSize,
          $skip: offset,
          ...types[serviceName].query,
          // record_id: 39214,
          // primary_media_media_type: { $in: ['Video', 'Image', 'PDF'] },
        },
      });

      console.log(`Processing batch: ${offset} to ${offset + items.length} of ${totalItems}`);
      total = totalItems;
      if (items.length === 0) break;

      // Create one transaction for the entire batch
      const knex = app.get('postgresqlClient');
      const trx = await knex.transaction();

      try {
        // Process items in smaller chunks within the transaction
        for (let i = 0; i < items.length; i += concurrency) {
          const chunk = items.slice(i, i + concurrency);

          // Process chunk items in parallel
          const chunkPromises = chunk.map(async (item) => {
            const idPath = `${serviceName.slice(0, -1)}_id`;
            const id = item[idPath];
            const url = get(item, types[serviceName].path);
            const exists = await fs.access(`public/img/thumbnails/${serviceName}/${id}.jpg`).then(() => true).catch(() => false);
            if (!url || exists) {
              // console.log(`No media URL for record ID ${id}, skipping...`);
              return { success: true, id };
            }

            try {
              const context = {
                app,
                service: app.service(`api/${serviceName}`),
                method: 'patch',
                type: 'after',
                id,
                result: { [idPath]: id },
                relation_data: item,
                params: {
                  user: { user_id: 1, archive_id: 1 },
                  transaction: { trx }, // Share the same transaction
                },
              };
              // console.log(context);

              // console.time(`hook-${id}`);
              await updateThumbnail(context);
              // console.timeEnd(`hook-${id}`);

              return { success: true, id };
            } catch (err) {
              console.error(`Failed to update record ID ${id}:`, url, err.message);
              return { success: false, id, error: err.message };
            }
          });

          // Wait for this chunk to complete before proceeding
          const results = await Promise.all(chunkPromises);
          const successCount = results.filter(r => r.success).length;
          totalUpdated += successCount;
          printProgress(Math.round((totalUpdated / total) * 100));
        }

        // Commit the entire batch transaction
        await trx.commit();
        console.log(` ✓ Batch committed`);

      } catch (batchError) {
        await trx.rollback();
        console.error('Batch failed, rolled back:', batchError.message);
      }

      offset += items.length;
    }

    console.log(`\nThumbnail update process completed. Total items updated: ${totalUpdated}`);
  } catch (err) {
    console.error('Error during thumbnail update process:', err);
  } finally {
    process.exit(0);
  }
}

// Export both functions so you can choose
export { updateThumbnailsWithHook };

// Uncomment to run the hook version instead
updateThumbnailsWithHook();
// updateThumbnailsWithHook('collections');
