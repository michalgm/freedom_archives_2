import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collections as collectionsService } from '../api';
import FieldRow from '../components/FieldRow';
import Field from '../components/Field';
import Form from '../components/Form';
import { Grid } from '@material-ui/core';
import GridBlock from '../components/GridBlock';
import ListItemField from '../components/ListItemField';
import Footer from '../components/Footer';

function Collection() {
  const [collection, setCollection] = useState({});
  const [edit, setEdit] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    const fetchCollection = async () => {
      const collection = await collectionsService.get(id);
      setCollection(collection);
    };
    fetchCollection();
  }, [id]);

  const updateCollection = async data => {
    const updated = await collectionsService.patch(id, data);
    setCollection(updated);
  };

  const deleteCollection = () => {};

  const buttons = edit
    ? [
        { label: 'Save', type: 'submit', color: 'primary' },
        { label: 'Delete', onClick: deleteCollection, color: 'secondary' },
        {
          label: 'Cancel',
          onClick: () => setEdit(false),
          variant: 'outlined',
          type: 'reset',
        },
      ]
    : [{ label: 'Edit', onClick: () => setEdit(true), type: 'button' }];

  return (
    <Grid
      container
      justify="center"
      alignItems="center"
      alignContent="center"
      spacing={4}
    >
      <GridBlock>
        <Form
          initialValues={collection}
          onSubmit={updateCollection}
          ro={!edit}
          buttons={buttons}
        >
          <FieldRow>
            <Field name="collection_name" />
            <Field name="parent" type="select" searchType="collections" />
          </FieldRow>
          <FieldRow>
            <Field name="is_hidden" type="checkbox" />
            <Field name="needs_review" type="checkbox" />
          </FieldRow>
          <FieldRow>
            <Field name="call_number" type="call_number" />
            <Field name="publisher" />
          </FieldRow>
          <FieldRow>
            <Field name="date_range" />
            <Field name="thumbnail" />
          </FieldRow>
          <FieldRow>
            <ListItemField name="keywords" isMulti />
          </FieldRow>
          <FieldRow>
            <ListItemField name="subjects" isMulti />
          </FieldRow>
          <FieldRow>
            <Field name="description" type="html" />
          </FieldRow>
          <FieldRow>
            <Field name="summary" multiline />
          </FieldRow>
          <FieldRow>
            <Field name="notes" multiline />
          </FieldRow>
        </Form>
      </GridBlock>
      <Footer item={collection} />
      {/* <Grid item xs={12}>
        <pre style={{ textAlign: 'left' }}>
          {JSON.stringify(collection, null, 2)}
        </pre>
      </Grid> */}
    </Grid>
  );
}

export default Collection;
