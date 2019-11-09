import React, { useState, useEffect } from 'react';
import { app } from './api';
import { Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { useStateValue } from './appContext'

function Records() {
  const { state: { search }, dispatch } = useStateValue();

  const [records, setRecords] = useState({ count: 0, records: [] });
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);

  const fetchRecords = async ($fullText = "") => {
    setLoading(true)
    const time = new Date();
    const { total, data: records } = await app.service('records').find({ query: { $select: ['record_id', 'title'], $fullText, $limit: 20 } });
    setRecords({ total, records });
    setLoading(false)
    setTime((new Date() - time) / 1000)
  }

  useEffect(() => {
    fetchRecords(search)
  }, [search])


  return (
    <div>
      <ul>
        <Formik
          initialValues={{ search }}
          onSubmit={({ search }) => {
            // fetchRecords(search)
            dispatch('SET_SEARCH', search);
          }}
        >
          <Form>
            <Field name='search' placeholder="Search Records" />
            <button type='submit'>Search</button>
          </Form>
        </Formik>
        {
          loading ?
            <div>Searching...</div>
            : <div>
              <p>{records.total} total results ({time} seconds)</p>
              {records.records.map(record => {
                return <li key={record.record_id}>
                  <Link to={`/record/${record.record_id}`}>
                    {record.title}
                  </Link> ({record.score})
              </li>
              })
              }

            </div>
        }
      </ul>
    </div >
  );
}

export default Records;
