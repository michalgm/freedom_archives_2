import React, { useState, useEffect, useRef } from 'react';
import { relationships } from './api';
import ButtonLink from './components/ButtonLink';
import Relationship from './Relationship';
import {
  Button,
  Grid,
  TextField,
  Paper
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import './Relationships.scss';

function Relationships({ skip = 0 }) {
  const $skip = parseInt(skip, 10)
  const [total, setTotal] = useState(0);
  const [relation, setRelation] = useState({});
  const [id, setId] = useState(null);
  const [notes, setNotes] = useState('');
  const [type, setType] = useState('');

  const info = {
    'original': "All instances of Record 2 will become instances of Record 1, and Record 2 will be deleted",
    'instance': "All instances of Record 1 will become instances of Record 2, and Record 1 will be deleted",
    'child': "Record 2 will become a child record of Record 1",
    'parent': "Record 1 will become a child record of Record 2",
    'sibling': "Record 2 will become a child record of Record 1's parent",
    "unknown": "The relationship between these documents will require further review"
  }

  useEffect(() => {
    const fetchRelations = async () => {
      const relation = await relationships.find({
        query: {
          $sort: { 'id': 1 },
          type: '',
          $limit: 1,
          $skip: $skip - 1
        }
      })
      setTotal(relation.total)
      setRelation(relation.data[0] || {});
      setType('')
    }
    fetchRelations();
  }, [$skip, id])

  if (!relation.docid_1) {
    return null;
  }

  const setRelationType = async () => {
    await relationships.patch(relation.id, { type, notes });
    setId(relation.id)
  };

  const updateNotes = event => {
    setNotes(event.target.value)
  }

  return (
    <div className='relationships'>
      <Grid container spacing={4} justify="center" alignItems="center" direction="row">
        <Paper> 
        <Grid item xs={12}>
          <Grid container spacing={4} justify="center" alignItems="center" direction="row">

            <Grid item xs={12}>
              <ButtonLink to={`/relationships/${$skip - 1}`} disabled={$skip <= 0}>
                Prev
              </ButtonLink>
              {$skip + 1} out of {total}
              <ButtonLink to={`/relationships/${$skip + 1}`} disabled={$skip >= total}>
                Next
              </ButtonLink>
              <div>
                Record 1 is
                <ToggleButtonGroup
                  exclusive
                  value={type}
                  size="small"
                  onChange={(event, value) => setType(value)}
                >
                  <ToggleButton value='original'>the original</ToggleButton>
                  <ToggleButton value='instance'>an instance</ToggleButton>
                  <ToggleButton value='child'>a child</ToggleButton>
                  <ToggleButton value='parent'>the parent</ToggleButton>
                  <ToggleButton value='sibling'>a sibling</ToggleButton>
                  <ToggleButton value='unknown'>unknown</ToggleButton>
                </ToggleButtonGroup>
                of Record 2
              </div>
              {info[type]}
            </Grid>
            <Grid item xs={4} alignContent="center" alignItems="center">
              <TextField variant="outlined" value={notes} label="Relationship Notes" rows={4} multiline={true} onChange={updateNotes} />
            </Grid>
            <Grid item xs={4}>
              <Button variant="outlined" disabled={!type} color='primary' onClick={setRelationType}>Save Relation Type</Button>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
        <Grid item xs={12}>
          <Relationship id={relation.id} />
        </Grid>
      </Grid>
    </div>
  )
}

export default Relationships;
