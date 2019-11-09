import React, { useState, useEffect } from 'react';
import { useParams, Redirect } from 'react-router-dom';
import { app } from './api';

function Record() {
  const [{ record, new_record }, setRecord] = useState({ record: {}, new_record: {} });
  const [returnHome, set_returnHome] = useState(false)
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

  const deleteRecord = async () => {
    await app.service('records').remove(id);
    set_returnHome(true);
  }

  useEffect(() => {
    fetchRecord(id)
  }, [id])

  if (returnHome) {
    return <Redirect to="/" />
  }

  return (
    <>
      <p>
        {new_record.title}
      </p>
      <button onClick={() => deleteRecord()}>Delete</button>
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
