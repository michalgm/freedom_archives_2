import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { app } from './api';

function Record() {
  const [{ record, new_record }, setRecord] = useState({ record: {}, new_record: {} });
  const { id } = useParams();

  const fetchRecord = async (id) => {
    const record = await app.service('records').get(id);
    const new_record = {};
    ['title', 'description', 'call_number', 'location', 'publisher', 'program'].forEach(key => {
      new_record[key] = record[key];
    });
    ['keywords', 'subjects', 'authors', 'producers'].forEach(key => {
      new_record[key] = (record[key] || []).map(i => i.item).join(', ')
    })
    setRecord({ record, new_record });
  }

  useEffect(() => {
    fetchRecord(id)
  }, [id])

  return (
    <>
      <p>
        {new_record.title}
      </p>
      <table border={1}>
        {Object.keys(new_record).map(key =>
          <tr key={key}>
            <td><b>{key}</b></td>
            <td>{new_record[key]}</td>
          </tr>
        )}
      </table>
      <pre style={{ textAlign: 'left' }}>
        {JSON.stringify(record, null, 2)}
      </pre>
    </>
  )
}

export default Record;
