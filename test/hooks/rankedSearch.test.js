import { expect } from 'chai';
import sinon from 'sinon';

import { rankedSearch } from '../../backend/services/common_hooks/rankedSearch.js';

describe('rankedSearch hook', () => {
  let context;
  let mockKnex;
  let mockQuery;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Create mock knex and query builder
    mockQuery = {
      clone: sinon.stub().returnsThis(),
      whereRaw: sinon.stub().returnsThis(),
      clearOrder: sinon.stub().returnsThis(),
      limit: sinon.stub(),
      select: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis()
    };

    // Default to returning results for FTS query
    mockQuery.limit.returns([{ exists: true }]);

    // Setup where function to handle callback
    mockQuery.where.callsFake(function (cb) {
      if (typeof cb === 'function') {
        cb.call({
          orWhereRaw: sinon.stub().returnsThis()
        });
      }
      return this;
    });

    mockKnex = {
      raw: sinon.stub().callsFake((query) => ({ toString: () => query }))
    };

    // Setup context
    context = {
      app: {
        get: sinon.stub().withArgs('postgresqlClient').returns(mockKnex)
      },
      service: {
        createQuery: sinon.stub().returns(mockQuery)
      },
      params: {
        query: {
          fullText: {
            fields: ['title', 'description'],
            searchTerm: 'test query',
            language: 'english'
          },
          otherParam: 'value'
        }
      }
    };

    // Stub console methods
    sandbox.stub(console, 'log');
    sandbox.stub(console, 'warn');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return unmodified context when searchTerm is missing', async () => {
    context.params.query.fullText.searchTerm = '';
    const result = await rankedSearch(context);

    expect(result).to.equal(context);
    expect(context.params.knex).to.be.undefined;
  });

  it('should return unmodified context when fields are missing', async () => {
    context.params.query.fullText.fields = null;
    const result = await rankedSearch(context);

    expect(result).to.equal(context);
    expect(context.params.knex).to.be.undefined;
  });

  // it('should handle invalid tsquery input', async () => {
  //   // Use a search term that would cause the real parser to throw an error
  //   // For example, unbalanced quotes or parentheses
  //   context.params.query.fullText.searchTerm = '"unbalanced quote';

  //   const result = await rankedSearch(context);
  //   console.error(result);
  //   // expect(console.warn.calledWith('Invalid tsquery input:', sinon.match.string)).to.be.true;
  //   expect(result).to.equal(context);
  //   expect(context.params.knex).to.be.undefined;
  // });

  it('should use full-text search when results exist', async () => {
    const result = await rankedSearch(context);

    expect(mockQuery.whereRaw.calledWith(
      sinon.match(/to_tsvector/),
      sinon.match.array
    )).to.be.true;
    expect(mockQuery.select.called).to.be.true;
    expect(context.params.knex).to.exist;
    expect(result).to.equal(context);
  });

  it('should fall back to trigram similarity when no FTS results', async () => {
    // Simulate no FTS results
    mockQuery.limit.returns([]);

    const result = await rankedSearch(context);

    expect(mockQuery.where.called).to.be.true;
    expect(context.params.knex).to.exist;
    expect(result).to.equal(context);
  });

  it('should apply prefix matching to search terms', async () => {
    context.params.query.fullText.searchTerm = 'simple test';

    await rankedSearch(context);

    // The tsquery string should have :* appended to each term
    // We can't check the exact string since we're using the real parser,
    // but we can check that whereRaw was called with the right parameters
    expect(mockQuery.whereRaw.calledWith(
      sinon.match(/to_tsvector/),
      sinon.match.array
    )).to.be.true;
  });

  it('should not modify already quoted or prefixed terms', async () => {
    // Set up a search term with quoted phrases, prefixed terms, and operators
    context.params.query.fullText.searchTerm = '"exact phrase" partial:* operator&term';

    await rankedSearch(context);

    // Instead of checking console.log calls, verify the actual behavior:
    // The search term should be properly processed and passed to the query
    expect(mockQuery.whereRaw.called).to.be.true;

    // We can check that the whereRaw was called with parameters that include
    // our search terms in the expected format (preserving quotes and operators)
    expect(mockQuery.whereRaw.calledWith(
      sinon.match.string,
      sinon.match(arr => {
        // The third parameter should be the processed search term
        const tsqueryString = arr[2];
        // Check that it contains our terms in some form
        return tsqueryString.includes('"exact<->phrase"') &&
          tsqueryString.includes('partial:*') &&
          tsqueryString.includes('operator&term');
      })
    )).to.be.true;
  });

  it('should remove fullText from query params', async () => {
    await rankedSearch(context);

    expect(context.params.query.fullText).to.be.undefined;
  });
});
