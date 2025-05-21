import app from '../../backend/app.js';

/**
 * Debug utility to analyze search results and explain ranking
 * @param {string} serviceName - Name of the service to query
 * @param {string} searchTerm - The search term
 * @param {string[]} fields - Fields to search in
 * @param {number} limit - Number of results to return
 */
async function debugSearch(serviceName, searchTerm, fields, limit = 10) {
  const service = app.service(serviceName);

  const result = await service.find({
    query: {
      fullText: {
        searchTerm,
        fields
      },
      $limit: limit
    }
  });

  console.log(`\n=== Search Results for "${searchTerm}" ===`);
  console.log(`Total results: ${result.total}`);

  result.data.forEach((item, index) => {
    console.log(`\n[${index + 1}] Rank: ${item.rank.toFixed(6)}`);
    console.log(`ID: ${item.id}`);

    fields.forEach(field => {
      if (item[field]) {
        const value = typeof item[field] === 'string'
          ? item[field].substring(0, 100) + (item[field].length > 100 ? '...' : '')
          : item[field];
        console.log(`${field}: ${value}`);
      }
    });

    // Calculate why this item might have ranked as it did
    const exactMatches = fields.filter(field =>
      item[field] &&
      item[field].toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (exactMatches.length > 0) {
      console.log(`Exact matches in: ${exactMatches.join(', ')}`);
    }

    // Check for prefix matches
    const prefixMatches = fields.filter(field =>
      item[field] &&
      !item[field].toLowerCase().includes(searchTerm.toLowerCase()) &&
      searchTerm.split(' ').some(term =>
        new RegExp(`\\b${term.toLowerCase()}\\w*`, 'i').test(item[field])
      )
    );

    if (prefixMatches.length > 0) {
      console.log(`Prefix matches in: ${prefixMatches.join(', ')}`);
    }
  });
}

// Example usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const searchTerm = args[0] || 'freedom';
  const fields = args[1] ? args[1].split(',') : ['title', 'description', 'authors_text', 'subjects_text'];
  const limit = parseInt(args[2] || '10', 10);

  debugSearch('records', searchTerm, fields, limit)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { debugSearch };