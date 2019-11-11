import React, { useState, useEffect } from 'react';
import { app } from './api';
import { Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { useStateValue } from './appContext'

function Records() {
  const { state: { search }, dispatch } = useStateValue();

  const [records, setRecords] = useState({ count: 0, records: [] });
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
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
        }
        const { total, data: records, filters = [] } = await
          app.service('records').find({ query });
        setRecords({ total, records });
        setFilters(filters);
        setTime((new Date() - time) / 1000)
      } catch { }
      setLoading(false)
    }
    fetchRecords()
  }, [search])

  const addFilter = ({ type, value }) => {
    const newFilter = { [type]: [...(search[type] || []), value] };
    dispatch('SET_SEARCH', { ...search, ...newFilter });
  }

  const clearFilters = () => {
    filters.forEach(({ type }) => {
      delete search[type];
    })
    dispatch('SET_SEARCH', { ...search });
  }

  const renderResults = () => (
    <ul style={{ flexGrow: 2 }}>
      {records.records.map((record) => (
        <li key={record.record_id}>
          <Link to={`/record/${record.record_id}`}>
            {record.title}
          </Link> {record.score && <span>{`(${record.score})`}</span>}
          <div>
            {record.description.slice(0, 100)} {record.description.length > 100 ? '...' : ''}
          </div>
        </li>
      ))}
    </ul>
  );

  const renderFilters = () => (
    <div>
      <h5>Filters</h5>
      <button onClick={() => clearFilters()}>Clear Filters</button>
      {filters.map(renderFilter)}
    </div>
  );

  const renderFilter = ({ type, values }) => (
    <div key={type} style={{ flexGrow: 1 }}>
      <h6>{type}</h6>
      <ul>
        {
          values
            .slice(0, 5)
            .map(([value, count], i) => renderFilterItem({ value, count, type, i }))
        }
      </ul>
    </div >
  )

  const renderFilterItem = ({ value, count, i, type }) => (
    <li
      key={i}
      onClick={() => addFilter({ type, value })}
    >
      <a href="" onClick={e => e.preventDefault()}
        style={{ fontWeight: (search[type] || []).includes(value) ? 800 : 400 }}
      >
        {value}
      </a> &nbsp;
      ({count})
    </li>

  )

  const renderForm = () => (
    <Formik
      initialValues={search}
      onSubmit={(fields) => {
        dispatch('SET_SEARCH', { ...search, ...fields });
      }}
    >
      {({ values, handleChange, submitForm, isSubmitting }) => {
        return (
          <Form style={{ padding: 5, margin: 5 }}>
            <Field name='$fullText' placeholder="Search Records" />
            <button type='submit' disabled={isSubmitting}>Search</button>
            <label>Only Digital</label>
            <Field
              name='has_digital'
              type="checkbox"
              checked={values.has_digital}
              onChange={(e) => { handleChange(e); submitForm() }}
            />
          </Form>
        )
      }}
    </Formik>
  )

  return (
    <div>
      {renderForm()}
      {
        loading ?
          <div>Searching...</div>
          :
          <div>
            <p>{records.total} total results ({time} seconds)</p>
            <div style={{ textAlign: 'left', margin: 'auto', display: 'flex' }}>
              {renderResults()}
              {renderFilters()}
            </div>
          </div>
      }
    </div>
  );
}

export default Records;
