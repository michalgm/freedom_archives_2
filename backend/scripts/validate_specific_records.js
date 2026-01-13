/* eslint-disable no-console */
import app from '../app.js';
import { parseError } from '../schema/schemaUtils.js';
import schemas from '../schema/zod_schema.js';

async function validateSpecificRecords(options = {}) {
  try {
    const {
      batchSize = 100,
      recordIds = null,
      onlyInvalid = true,
      verbose = true,
      showIssueDetails = true,
    } = options;

    console.log('Starting paginated unified records validation...\n');

    const unifiedRecordsService = app.service('api/unified_records');
    const { recordsDataSchema } = schemas;

    let query = {};
    let totalProcessed = 0;
    let totalRecords = 0;
    let validCount = 0;
    let invalidCount = 0;
    const $select = Object.keys(recordsDataSchema.shape);

    // Track issues: { "field.path: error message": { count: number, recordIds: [ids] } }
    const issueTracker = {};

    // If specific record IDs are provided, don't paginate
    if (recordIds && recordIds.length > 0) {
      query.record_id = { $in: recordIds };

      const response = await unifiedRecordsService.find({
        query,
      });

      const records = Array.isArray(response) ? response : response.data || [];
      console.log(`Validating ${records.length} specific records...\n`);

      const batchStats = await validateBatch(records, recordsDataSchema, issueTracker, onlyInvalid, verbose);
      validCount += batchStats.valid;
      invalidCount += batchStats.invalid;
      totalProcessed = records.length;
    } else {
      // Paginated processing
      let currentPage = 0;
      let hasMoreRecords = true;

      while (hasMoreRecords) {
        const skip = currentPage * batchSize;

        const paginatedQuery = {
          ...query,
          $limit: batchSize,
          $skip: skip,
          $sort: { record_id: 1 },
          $select, //: ['title', 'description', 'collection', 'media']
        };
        console.log(`Fetching batch ${currentPage + 1} (records ${skip + 1}-${skip + batchSize})...`);
        const response = await unifiedRecordsService.find({
          query: paginatedQuery,
        });
        const records = response.data || [];
        const total = response.total || 0;

        // Set total on first iteration
        if (currentPage === 0) {
          totalRecords = total;
          console.log(`Found ${totalRecords} total records to validate\n`);
        }

        if (records.length === 0) {
          hasMoreRecords = false;
          break;
        }

        console.log(`Processing batch ${currentPage + 1}: ${records.length} records`);

        const batchStats = await validateBatch(records, recordsDataSchema, issueTracker, onlyInvalid, verbose);
        validCount += batchStats.valid;
        invalidCount += batchStats.invalid;

        totalProcessed += records.length;

        // Progress update
        const progressPercent = ((totalProcessed / totalRecords) * 100).toFixed(1);
        const invalidPercent = ((invalidCount / totalRecords) * 100).toFixed(1);
        console.log(`Batch ${currentPage + 1} complete: ${batchStats.valid} valid, ${batchStats.invalid} invalid`);
        console.log(`Overall progress: ${totalProcessed}/${totalRecords} (${progressPercent}%) | Valid: ${validCount}, Invalid: ${invalidCount}, (${invalidPercent}%)\n`);

        // Check if we've processed all records
        if (totalProcessed >= totalRecords || records.length < batchSize) {
          hasMoreRecords = false;
        }

        currentPage++;
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('FINAL VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total records processed: ${totalProcessed}`);
    console.log(`✅ Valid: ${validCount}`);
    console.log(`❌ Invalid: ${invalidCount}`);
    console.log(`Success rate: ${((validCount / totalProcessed) * 100).toFixed(2)}%`);

    // Detailed issue breakdown
    if (invalidCount > 0 && showIssueDetails) {
      console.log('\n' + '='.repeat(80));
      console.log('DETAILED ISSUE BREAKDOWN');
      console.log('='.repeat(80));

      // Sort issues by frequency (most common first)
      const sortedIssues = Object.entries(issueTracker)
        .sort(([, a], [, b]) => b.count - a.count);

      console.log(`Found ${sortedIssues.length} unique validation issues:\n`);

      sortedIssues.forEach(([issueKey, issueData], index) => {
        const { count, recordIds } = issueData;
        const percentage = ((count / invalidCount) * 100).toFixed(1);

        console.log(`${index + 1}. ${issueKey}`);
        console.log(`   Count: ${count} records (${percentage}% of invalid records)`);
        console.log(`   Record IDs: ${recordIds.slice(0, 20).join(', ')}${recordIds.length > 20 ? ` ... and ${recordIds.length - 20} more` : ''}`);
        console.log('');
      });

      // Summary of most common issues
      console.log('\n' + '-'.repeat(80));
      console.log('TOP 5 MOST COMMON ISSUES:');
      console.log('-'.repeat(80));

      sortedIssues.slice(0, 5).forEach(([issueKey, issueData], index) => {
        console.log(`${index + 1}. ${issueKey} (${issueData.count} records)`);
      });
    }

    return {
      summary: {
        totalProcessed,
        validCount,
        invalidCount,
        successRate: ((validCount / totalProcessed) * 100).toFixed(2),
      },
      issues: issueTracker,
    };

  } catch (error) {
    console.error('Script error:', error);
    throw error;
  } finally {
    await app.teardown();
    process.exit(0);
  }
}

async function validateBatch(records, schema, issueTracker, onlyInvalid, verbose) {
  let batchValid = 0;
  let batchInvalid = 0;

  for (const record of records) {
    try {
      schema.parse(record);
      batchValid++;

      if (!onlyInvalid && verbose) {
        console.log(`✅ Record ${record.record_id}: ${record.title || 'No title'}`);
      }
    } catch (validationError) {
      batchInvalid++;

      console.log(`❌ Record ${record.record_id}: ${record.title || 'No title'}`);
      
      // Handle zod v4 error structure - use .issues property
      const errors = validationError.issues || validationError.errors || [];
      
      if (errors && Array.isArray(errors) && errors.length > 0) {
        errors.forEach(err => {
          const fieldPath = err.path?.join('.').replace(/\d+/, 'x') || 'root';
          const message = parseError(fieldPath)(err);
          const issueKey = message;

          // Initialize or update issue tracking
          if (!issueTracker[issueKey]) {
            issueTracker[issueKey] = {
              count: 0,
              recordIds: [],
            };
          }

          issueTracker[issueKey].count++;
          issueTracker[issueKey].recordIds.push(record.record_id);

          if (verbose) {
            console.log(`   - ${message}`);
          }
        });
      } else {
        // Handle generic error case (no structured errors array)
        const message = validationError.message || String(validationError);
        const issueKey = `general: ${message}`;
        if (!issueTracker[issueKey]) {
          issueTracker[issueKey] = {
            count: 0,
            recordIds: [],
          };
        }
        issueTracker[issueKey].count++;
        issueTracker[issueKey].recordIds.push(record.record_id);

        if (verbose) {
          console.log(`   - ${message}`);
        }
      }
    }
  }

  return {
    valid: batchValid,
    invalid: batchInvalid,
  };
}

// Helper function to export issues to JSON file (optional)
async function exportIssues(issues, filename = 'validation_issues.json') {
  const fs = await import('fs/promises');
  try {
    await fs.writeFile(filename, JSON.stringify(issues, null, 2));
    console.log(`\nIssue details exported to ${filename}`);
  } catch (error) {
    console.error('Failed to export issues:', error.message);
  }
}

// Examples of usage:
// validateSpecificRecords(); // Default: validate all records in batches of 100
// validateSpecificRecords({ batchSize: 50 }); // Validate in batches of 50
// validateSpecificRecords({ recordIds: [1, 2, 3, 4, 5] }); // Validate specific records
// validateSpecificRecords({ onlyInvalid: true, verbose: false }); // Only show invalid, minimal output
// validateSpecificRecords({ showIssueDetails: false }); // Skip detailed issue breakdown
const record_ids = process.argv[2] ? process.argv[2].split(',').map(id => parseInt(id, 10)) : null;
const issues = await validateSpecificRecords({ recordIds: record_ids });
exportIssues(issues);
