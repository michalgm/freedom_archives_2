import React, { useState, useEffect } from 'react';
import { records as recordsService } from './api';
import { Link } from 'react-router-dom';
// import { Formik, Form, Field } from 'formik';
import { useStateValue } from './appContext';
import Form from './components/Form';
import Field from './components/Field';
import FieldRow from './components/FieldRow';
import { Link as MULink, Typography, Button, Grid } from '@material-ui/core';
import './Records.scss';

function Records() {
  const {
    state: { search },
    dispatch,
  } = useStateValue();

  const [records, setRecords] = useState({ count: 0, records: [] });
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      const time = new Date();
      try {
        const { $fullText, has_digital, keyword, subject, author } = search;
        const query = {
          $select: ['record_id', 'title', 'description'],
          $limit: 20,
          $fullText: $fullText,
          has_digital: has_digital,
          keywords_search: { $contains: keyword },
          subjects_search: { $contains: subject },
          authors_search: { $contains: author },
        };
        const {
          total,
          data: records,
          filters = [],
        } = await recordsService.find({ query });
        setRecords({ total, records });
        setFilters(filters);
        setTime((new Date() - time) / 1000);
      } catch {}
      setLoading(false);
    };
    fetchRecords();
  }, [search]);

  const addFilter = ({ type, value }) => {
    const newFilter = { [type]: [...(search[type] || []), value] };
    dispatch('SET_SEARCH', { ...search, ...newFilter });
  };

  const clearFilters = () => {
    filters.forEach(({ type }) => {
      delete search[type];
    });
    dispatch('SET_SEARCH', { ...search });
  };

  const renderResults = () => (
    <ul style={{ flexGrow: 2 }}>
      {records.records.map(record => (
        <li key={record.record_id}>
          <Link to={`/record/${record.record_id}`}>{record.title}</Link>{' '}
          {record.score && <span>{`(${record.score})`}</span>}
          <div>
            {record.description.slice(0, 100)}{' '}
            {record.description.length > 100 ? '...' : ''}
          </div>
        </li>
      ))}
    </ul>
  );

  const renderFilters = () => (
    <div>
      <Typography variant="h5">Filters</Typography>
      <Button
        color="primary"
        variant="contained"
        onClick={() => clearFilters()}
      >
        Clear Filters
      </Button>
      {filters.map(renderFilter)}
    </div>
  );

  const renderFilter = ({ type, values }) => (
    <div key={type} style={{ flexGrow: 1 }}>
      <Typography variant="h6">{type}</Typography>
      <ul>
        {values
          .slice(0, 5)
          .map(([value, count], i) =>
            renderFilterItem({ value, count, type, i })
          )}
      </ul>
    </div>
  );

  const renderFilterItem = ({ value, count, i, type }) => (
    <li key={i} onClick={() => addFilter({ type, value })}>
      <MULink
        href=""
        onClick={e => e.preventDefault()}
        style={{ fontWeight: (search[type] || []).includes(value) ? 800 : 400 }}
      >
        {value}
      </MULink>{' '}
      &nbsp;({count})
    </li>
  );

  const renderForm = () => (
    <Grid container>
      <Grid item md={false} lg={2} xl={4} />
      <Grid item md={12} lg={8} xl={4} className="search-form">
        <Form
          initialValues={search}
          onSubmit={fields => {
            dispatch('SET_SEARCH', { ...search, ...fields });
          }}
        >
          <FieldRow>
            <Field
              name="$fullText"
              label="Search"
              placeholder="Search Records"
              autoSubmit={300}
            />
            <Field
              name="has_digital"
              label="Only Digital"
              type="checkbox"
              autoSubmit
            />
          </FieldRow>
        </Form>
      </Grid>
    </Grid>
  );

  return (
    <div className="records">
      {renderForm()}
      {loading ? (
        <div>Searching...</div>
      ) : (
        <div className="results">
          <p className="results-total">
            {records.total} total results ({time} seconds)
          </p>
          <div style={{ textAlign: 'left', margin: 'auto', display: 'flex' }}>
            {renderResults()}
            {renderFilters()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Records;
