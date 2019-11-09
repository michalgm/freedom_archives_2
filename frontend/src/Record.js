import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import { useParams, Redirect } from 'react-router-dom';
import { app } from './api';

function Record() {
  const [{ record, new_record }, setRecord] = useState({ record: {}, new_record: {} });
  const [returnHome, set_returnHome] = useState(false);
  const [loading, setLoading] = useState(true);

  const { id } = useParams();

  const loadRecord = record => {
    const new_record = {};
    ['title', 'description', 'call_number', 'location', 'publisher', 'program'].forEach(key => {
      new_record[key] = record[key];
    });
    ['keywords', 'subjects', 'authors', 'producers'].forEach(key => {
      new_record[key] = (record[key] || []).map(i => i.item).join(', ')
    })
    setRecord({ record, new_record });
    setLoading(false);
  }

  const deleteRecord = async () => {
    setLoading(true);
    await app.service('records').remove(id);
    set_returnHome(true);
  }

  const updateRecord = async (data) => {
    setLoading(true);
    const updated = await app.service('records').patch(id, data);
    loadRecord(updated);
  }

  useEffect(() => {
    app.service('records').get(id)
      .then(loadRecord);
  }, [id])

  if (returnHome) {
    return <Redirect to="/" />
  }
  if (loading) {
    return "Loading..."
  }

  return (
    <>
      <p>
        {new_record.title}
      </p>
      {
        new_record.title &&
        <Formik
          initialValues={{ title: new_record.title }}
          onSubmit={updateRecord}
        >
          <Form>
            <Field name='title' placeholder="Set Title" />
            <button type='submit'>Save</button>
          </Form>
        </Formik>
      }
      <button onClick={() => deleteRecord()}>Delete</button>
      <table border={1}><tbody>
        {Object.keys(new_record).map(key =>
          <tr key={key}>
            <td><b>{key}</b></td>
            <td>{new_record[key]}</td>
          </tr>
        )}</tbody>
      </table>
      <pre style={{ textAlign: 'left' }}>
        {JSON.stringify(record, null, 2)}
      </pre>
    </>
  )
}

export default Record;
