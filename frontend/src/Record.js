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
    new_record.instances = (<table border="1" >
      <thead><tr>
        <th>Thumbnail</th>
        <th>Format</th>
        <th>Quality</th>
        <th>Media Type</th>
        <th>Primary</th>
        <th>Copies</th>
        <th>Link</th>
        <th>Original docid</th></tr>
      </thead>
      <tbody>{
        record.instances.map(instance => (
          <tr key={instance.instance_id}>
            <td>{instance.thumbnail ? <img width="20" src={"https://search.freedomarchives.org/" + instance.thumbnail} /> : null}</td>
            <td>{instance.format_value}</td>
            <td>{instance.quality_value}</td>
            <td>{instance.media_type}</td>
            <td>{instance.is_primary ? 'Y' : ''}</td>
            <td>{instance.copies}</td>
            <td>{instance.url ? <a href={instance.url} target="_blank">Link</a> : null}</td>
            <td>{instance.original_doc_id}</td>
          </tr>
        ))}</tbody>
    </table >
    )
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
    await app.service('records').patch(id, data);
    const updated = await app.service('records').get(id)
    loadRecord(updated);
  }

  useEffect(() => {
    app.service('records').get(id)
      .then(loadRecord);
  }, [id])

  if (returnHome) {
    return <Redirect to="/" />
  }
  // if (loading) {
  //   return "Loading..."
  // }

  return (
    <div className={loading ? 'loading' : null}>
      <p>
        {new_record.title}
      </p>
      {
        new_record.title &&
        <Formik
          initialValues={{ title: new_record.title }}
          onSubmit={updateRecord}
        >
          <Form >
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
    </div>
  )
}

export default Record;
