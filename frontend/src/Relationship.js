import React, { useState, useEffect } from 'react';
import { app } from './api';

import Record from './Record';
import Field from './components/Field';
import Link from './components/Link';
import {
  Grid,
  Paper,
  Divider,
  Typography
} from '@material-ui/core';

function Relationship({ id }) {
  const [relation, setRelation] = useState({});

  useEffect(() => {
    const fetchRelations = async () => {
      const relation = await app.service('relationships').get(id)
      setRelation(relation || {});
    }
    fetchRelations();
  }, [id])

  if (!relation.docid_1) {
    return null;
  }

  return (
    <div>
      <Grid container spacing={2}>
        {[1, 2].map(num => (
          <Grid item xs={6} key={num}>
            <Paper>
              <Typography variant="h4">
                Record {num}
              </Typography>
              <Typography variant="subtitle1">
                <Link to={`/record/${relation[`docid_${num}`]}`}>
                  (ID {relation[`docid_${num}`]})
                </Link>
              </Typography>
              <Field
                raw
                label='Relation Title'
                value={relation[`title_${num}`]}
              />
              <Field
                raw
                multiline
                label='Relation description'
                value={relation[`description_${num}`]}
              />
              <Field
                raw
                label='Relation Track Number'
                value={relation[`track_number_${num}`]}
              />
              <Divider />
            </Paper>
          </Grid>
        ))}

        {[1, 2].map(num => (
          <Grid item xs={6} key={num}>
            <Paper>
              <div style={{ padding: 4 }}>
                <Record id={relation[`docid_${num}`]} />
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

export default Relationship;
