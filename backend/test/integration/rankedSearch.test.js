import { expect } from 'chai';

import app from '../../app.js';


describe('Ranked Search Integration Tests', () => {
  let service;

  before(async () => {
    // Get a reference to the records service
    service = app.service('api/records');
  });

  it('should return results with exact matches ranked higher', async () => {
    // Test exact match ranking
    const exactMatchTerm = 'freedom';
    const result = await service.find({
      query: {
        fullText: {
          searchTerm: exactMatchTerm,
          fields: ['title', 'description', 'authors_text', 'subjects_text', 'keywords_text']
        },
        $sort: { rank: -1 },
        $limit: 10
      }
    });

    // Verify we got results
    expect(result.data.length).to.be.greaterThan(0);

    // Check if records with exact title matches are ranked higher
    if (result.data.length > 1) {
      const exactMatches = result.data.filter(r =>
        r.title && r.title.toLowerCase().includes(exactMatchTerm.toLowerCase())
      );

      if (exactMatches.length > 0) {
        // The first result should have a higher rank than later results without exact matches
        expect(result.data[0].rank).to.be.greaterThan(result.data[result.data.length - 1].rank);
      }
    }
  });

  it('should handle prefix matching correctly', async () => {
    // Test prefix matching (e.g., "free" should match "freedom")
    const result = await service.find({
      query: {
        fullText: {
          searchTerm: 'free',
          fields: ['title', 'description', 'authors_text']
        },
        $limit: 10
      }
    });

    expect(result.data.length).to.be.greaterThan(0);

    // Check if we get results with words starting with "free"
    const hasMatchingPrefix = result.data.some(r =>
      (r.title && r.title.toLowerCase().match(/\bfree\w*/)) ||
      (r.description && r.description.toLowerCase().match(/\bfree\w*/)) ||
      (r.authors_text && r.authors_text.toLowerCase().match(/\bfree\w*/))
    );

    expect(hasMatchingPrefix).to.be.true;
  });

  it('should handle multiple search terms', async () => {
    // Test multiple term search
    const result = await service.find({
      query: {
        fullText: {
          searchTerm: 'freedom movement',
          fields: ['title', 'description', 'subjects_text']
        },
        $limit: 10
      }
    });

    expect(result.data.length).to.be.greaterThan(0);

    // Records containing both terms should rank higher
    if (result.data.length > 1) {
      const containsBothTerms = result.data.filter(r =>
        (r.title && r.title.toLowerCase().includes('freedom') && r.title.toLowerCase().includes('movement')) ||
        (r.description && r.description.toLowerCase().includes('freedom') && r.description.toLowerCase().includes('movement')) ||
        (r.subjects_text && r.subjects_text.toLowerCase().includes('freedom') && r.subjects_text.toLowerCase().includes('movement'))
      );

      if (containsBothTerms.length > 0) {
        expect(containsBothTerms[0].rank).to.be.greaterThan(0);
      }
    }
  });

  it('should fall back to trigram similarity when no FTS matches', async () => {
    // Test with a misspelled word that should use trigram similarity
    const result = await service.find({
      query: {
        fullText: {
          searchTerm: 'freedum', // Misspelled "freedom"
          fields: ['title', 'description']
        },
        $limit: 10
      }
    });

    // Should still find results despite misspelling
    expect(result.data.length).to.be.greaterThan(0);

    // Check if we get results with similar words to "freedum"
    const hasSimilarMatches = result.data.some(r =>
      (r.title && r.title.toLowerCase().includes('freedom')) ||
      (r.description && r.description.toLowerCase().includes('freedom'))
    );

    expect(hasSimilarMatches).to.be.true;
  });

  it('should respect field weighting in search results', async () => {
    // Test if title matches are ranked higher than description matches
    const searchTerm = 'revolution';
    const result = await service.find({
      query: {
        fullText: {
          searchTerm,
          fields: ['title', 'description']
        },
        $limit: 20
      }
    });

    expect(result.data.length).to.be.greaterThan(0);

    // Group results by where the match was found
    const titleMatches = result.data.filter(r => r.title && r.title.toLowerCase().includes(searchTerm));
    const descriptionOnlyMatches = result.data.filter(r =>
      (!r.title || !r.title.toLowerCase().includes(searchTerm)) &&
      r.description && r.description.toLowerCase().includes(searchTerm)
    );

    // If we have both types of matches, title matches should generally rank higher
    if (titleMatches.length > 0 && descriptionOnlyMatches.length > 0) {
      const avgTitleRank = titleMatches.reduce((sum, r) => sum + r.rank, 0) / titleMatches.length;
      const avgDescRank = descriptionOnlyMatches.reduce((sum, r) => sum + r.rank, 0) / descriptionOnlyMatches.length;

      expect(avgTitleRank).to.be.greaterThan(avgDescRank);
    }
  });

  it('should handle different languages correctly', async () => {
    // Test with a non-English language parameter
    const result = await service.find({
      query: {
        fullText: {
          searchTerm: 'libertad', // Spanish for "freedom"
          fields: ['title', 'description'],
          language: 'spanish'
        },
        $limit: 10
      }
    });

    // Should find Spanish content
    expect(result.data.length).to.be.greaterThan(0);
  });
});