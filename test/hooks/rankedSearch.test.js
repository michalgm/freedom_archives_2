import knex from 'knex';
import mockKnex from 'mock-knex';
import sinon from 'sinon';
import { expect, describe, it, beforeEach, afterEach, afterAll } from 'vitest';

import { rankedSearch } from '../../backend/services/common_hooks/rankedSearch.js';

describe('rankedSearch hook', () => {
  let context;
  let db;
  let tracker;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Create a real knex instance with mock-knex tracker
    db = knex({
      client: 'pg',
      connection: {},
      debug: false,
      extendedOperators: {
        $overlap: "&&",
        $contains: "@>",
        $contained_by: "<@",
        $fulltext: "@@",
      },
    });

    // Install mock-knex tracker
    mockKnex.mock(db);
    tracker = mockKnex.getTracker();
    tracker.install();

    // Set up tracker to respond to queries
    tracker.on('query', (query) => {
      query.response([]);
    });

    // Create a real query builder from knex
    const baseQuery = db.queryBuilder();

    // Setup context
    context = {
      path: 'api/records',
      app: {
        get: sinon.stub().withArgs('postgresqlClient').returns(db),
      },
      service: {
        fullName: 'records',
        getOptions: sinon.stub().returns({ id: 'record_id', name: 'records' }),
        createQuery: sinon.stub().returns(baseQuery),
        sanitizeQuery: sinon.stub().resolvesArg(0),
      },
      params: {
        query: {
          $fullText: 'test query',
          otherParam: 'value',
        },
      },
    };

    // Stub console.log to prevent noise in test output
    sandbox.stub(console, 'log');
  });

  afterEach(() => {
    sandbox.restore();
    tracker.uninstall();
    mockKnex.unmock(db);
  });

  afterAll(() => {
    // Make sure mock-knex is completely uninstalled
    try {
      tracker.uninstall();
      mockKnex.unmock(db);
    } catch (e) {
      // Ignore errors if tracker is already uninstalled
    }
  });

  // it('should return unmodified context when searchTerm is missing', async () => {
  //   context.params.query.$fullText = '';
  //   const result = await rankedSearch(context);

  //   expect(result).toBe(context);
  //   expect(context.params.knex).toBeUndefined();
  // });

  // it('should return unmodified context when fields are missing', async () => {
  //   context.params.query.$fullText = null;
  //   const result = await rankedSearch(context);

  //   expect(result).toBe(context);
  //   expect(context.params.knex).toBeUndefined();
  // });

  it('should use full-text search and set knex in params', async () => {
    // Set up tracker to capture queries
    let capturedQueries = [];
    tracker.on('query', (query) => {
      capturedQueries.push(query.sql);
      query.response([]);
    });

    const result = await rankedSearch(context);

    expect(context.params.knex).toBeDefined();
    expect(result).toBe(context);

    // Verify that the query includes the expected components
    const queryString = context.params.knex.toString();
    expect(queryString).toContain('with');
    expect(queryString).toContain('ts_query');
    expect(queryString).toContain('to_tsquery');
  });

  it('should apply prefix matching to search terms', async () => {
    context.params.query.$fullText = 'simple test';

    await rankedSearch(context);

    // Verify that the query includes prefixed terms
    const queryString = context.params.knex.toString();
    expect(queryString).toContain('simple:*');
    expect(queryString).toContain('test:*');
  });

  it('should not modify already quoted or prefixed terms', async () => {
    // Set up a search term with quoted phrases, prefixed terms, and operators
    context.params.query.$fullText = '"exact phrase" partial:* operator&term';

    await rankedSearch(context);
    // Verify the query string contains the properly formatted terms
    const queryString = context.params.knex.toString();
    expect(queryString).toContain('"exact<->phrase"');
    expect(queryString).toContain('partial:*');
    expect(queryString).toContain('operator&term');
  });

  it('should remove $fullText from query params', async () => {
    await rankedSearch(context);

    expect(context.params.query.$fullText).toBeUndefined();
    expect(context.params._rankedSearch).toBe('test query');
  });

  it('should include rank calculation in the query', async () => {
    await rankedSearch(context);

    const queryString = context.params.knex.toString();
    expect(queryString).toContain('as rank');
    expect(queryString).toContain('ts_rank');
    expect(queryString).toContain('word_similarity');
  });
});
