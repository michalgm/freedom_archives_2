import { expect } from 'chai';
import knex from 'knex';
import mockKnex from 'mock-knex';
import sinon from 'sinon';

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
      }
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
      app: {
        get: sinon.stub().withArgs('postgresqlClient').returns(db)
      },
      service: {
        fullName: 'records',
        createQuery: sinon.stub().returns(baseQuery),
        sanitizeQuery: sinon.stub().resolvesArg(0)
      },
      params: {
        query: {
          $fullText: 'test query',
          otherParam: 'value'
        }
      }
    };

    // Stub console.log to prevent noise in test output
    sandbox.stub(console, 'log');
  });

  afterEach(() => {
    sandbox.restore();
    tracker.uninstall();
    mockKnex.unmock(db);
  });

  after(() => {
    // Make sure mock-knex is completely uninstalled
    try {
      tracker.uninstall();
      mockKnex.unmock(db);
    } catch (e) {
      // Ignore errors if tracker is already uninstalled
    }
  });

  it('should return unmodified context when searchTerm is missing', async () => {
    context.params.query.$fullText = '';
    const result = await rankedSearch(context);

    expect(result).to.equal(context);
    expect(context.params.knex).to.be.undefined;
  });

  it('should return unmodified context when fields are missing', async () => {
    context.params.query.$fullText = null;
    const result = await rankedSearch(context);

    expect(result).to.equal(context);
    expect(context.params.knex).to.be.undefined;
  });

  it('should use full-text search and set knex in params', async () => {
    // Set up tracker to capture queries
    let capturedQueries = [];
    tracker.on('query', (query) => {
      capturedQueries.push(query.sql);
      query.response([]);
    });

    const result = await rankedSearch(context);

    expect(context.params.knex).to.exist;
    expect(result).to.equal(context);

    // Verify that the query includes the expected components
    const queryString = context.params.knex.toString();
    expect(queryString).to.include('with');
    expect(queryString).to.include('ts_query');
    expect(queryString).to.include('to_tsquery');
  });

  it('should apply prefix matching to search terms', async () => {
    context.params.query.$fullText = 'simple test';

    await rankedSearch(context);

    // Verify that the query includes prefixed terms
    const queryString = context.params.knex.toString();
    expect(queryString).to.include('simple:*');
    expect(queryString).to.include('test:*');
  });

  it('should not modify already quoted or prefixed terms', async () => {
    // Set up a search term with quoted phrases, prefixed terms, and operators
    context.params.query.$fullText = '"exact phrase" partial:* operator&term';

    await rankedSearch(context);

    // Verify the query string contains the properly formatted terms
    const queryString = context.params.knex.toString();
    expect(queryString).to.include('"exact phrase"');
    expect(queryString).to.include('partial:*');
    expect(queryString).to.include('operator&term');
  });

  it('should remove $fullText from query params', async () => {
    await rankedSearch(context);

    expect(context.params.query.$fullText).to.be.undefined;
    expect(context.params._rankedSearch).to.equal('test query');
  });

  it('should include rank calculation in the query', async () => {
    await rankedSearch(context);

    const queryString = context.params.knex.toString();
    expect(queryString).to.include('AS rank');
    expect(queryString).to.include('ts_rank');
    expect(queryString).to.include('word_similarity');
  });
});
