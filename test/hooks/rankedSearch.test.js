import knex from 'knex';
import mockKnex from 'mock-knex';
import sinon from 'sinon';
import { expect, describe, it, beforeEach, afterEach, afterAll } from 'vitest';

import { rankedSearch, applyBasicPrefixing, detectCallNumber } from "../../backend/services/common_hooks/rankedSearch.js";

describe("applyBasicPrefixing", () => {
  it("appends :* to bare words", () => {
    expect(applyBasicPrefixing("dog")).toBe("dog:*");
    expect(applyBasicPrefixing("dog pile")).toBe("dog:* pile:*");
  });

  it("leaves 2-word quoted phrases intact", () => {
    expect(applyBasicPrefixing('"black liberation"')).toBe('"black liberation"');
  });

  it("leaves 3-word quoted phrases intact", () => {
    expect(applyBasicPrefixing('"black liberation movement"')).toBe('"black liberation movement"');
  });

  it("mixes quoted phrases and bare words correctly", () => {
    expect(applyBasicPrefixing('"black liberation" prison')).toBe('"black liberation" prison:*');
    expect(applyBasicPrefixing('prison "black liberation"')).toBe('prison:* "black liberation"');
  });

  it("leaves already-prefixed terms alone", () => {
    expect(applyBasicPrefixing("dog:*")).toBe("dog:*");
  });

  it("leaves boolean operators alone", () => {
    expect(applyBasicPrefixing("dog&cat")).toBe("dog&cat");
    expect(applyBasicPrefixing("dog|cat")).toBe("dog|cat");
    expect(applyBasicPrefixing("!dog")).toBe("!dog");
  });
});

describe("detectCallNumber", () => {
  const prefixes = ["AFR", "CE", "MAJ", "M", "Vin", "V", "JG/LS"].sort((a, b) => b.length - a.length);
  const escaped = prefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`^(${escaped})(\\s+[\\d.]{1,5}([A-Z]| +R[\\d])?)?$`, "i");

  it("detects a prefix-only call number", async () => {
    expect(await detectCallNumber("CE", regex)).toBe("CE");
    expect(await detectCallNumber("AFR", regex)).toBe("AFR");
  });

  it("detects a full call number with numeric suffix", async () => {
    expect(await detectCallNumber("CE 047", regex)).toBe("CE 047");
    expect(await detectCallNumber("AFR 1.2", regex)).toBe("AFR 1.2");
  });

  it("detects call numbers with letter suffix", async () => {
    expect(await detectCallNumber("CE 5A", regex)).toBe("CE 5A");
  });

  it("detects call numbers with R suffix", async () => {
    expect(await detectCallNumber("CE 5 R1", regex)).toBe("CE 5 R1");
  });

  it("matches MAJ before M", async () => {
    expect(await detectCallNumber("MAJ 1", regex)).toBe("MAJ 1");
    expect(await detectCallNumber("M 1", regex)).toBe("M 1");
  });

  it("matches Vin before V", async () => {
    expect(await detectCallNumber("Vin 1", regex)).toBe("Vin 1");
    expect(await detectCallNumber("V 1", regex)).toBe("V 1");
  });

  it("handles prefixes with special characters like JG/LS", async () => {
    expect(await detectCallNumber("JG/LS 5", regex)).toBe("JG/LS 5");
  });

  it("returns null for plain search terms", async () => {
    expect(await detectCallNumber("black liberation", regex)).toBeNull();
    expect(await detectCallNumber("prison", regex)).toBeNull();
  });

  it("returns null for invalid suffix", async () => {
    expect(await detectCallNumber("CE toolong", regex)).toBeNull();
    expect(await detectCallNumber("CE !!!", regex)).toBeNull();
  });
});

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

  it('should include trigram fuzzy match for plain search terms', async () => {
    context.params.query.$fullText = 'havana';

    await rankedSearch(context);

    const queryString = context.params.knex.toString();
    expect(queryString).toContain('%>');
  });

  it('should not use trigram fuzzy match for quoted phrase searches', async () => {
    context.params.query.$fullText = '"first visit to havana"';

    await rankedSearch(context);

    const queryString = context.params.knex.toString();
    expect(queryString).not.toContain('%>');
  });

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
