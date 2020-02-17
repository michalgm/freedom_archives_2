import React, { useState, useEffect } from 'react';
import { app } from './api';

import ButtonLink from './components/ButtonLink';
import Relationship from './Relationship';
import {
  Button,
  ButtonGroup,
  Grid,
} from '@material-ui/core';

function Relationships({ skip = 1 }) {
  const $skip = parseInt(skip, 10)
  const [total, setTotal] = useState(0);
  const [relation, setRelation] = useState({});

  useEffect(() => {
    const fetchRelations = async () => {
      const relation = await app.service('relationships').find({
        query: {
          $sort: { 'id': 1 },
          type: '',
          $limit: 1,
          $skip: $skip - 1
        }
      })
      setTotal(relation.total)
      setRelation(relation.data[0] || {});
    }
    fetchRelations();
  }, [$skip])

  if (!relation.docid_1) {
    return null;
  }

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ButtonLink to={`/relationships/${$skip - 1}`}>
            Prev
          </ButtonLink>
          {$skip} out of {total}
          <ButtonLink to={`/relationships/${$skip + 1}`}>
            Next
          </ButtonLink>
          <div>
            Record 1 is
            <ButtonGroup size="small">
              <Button>the original</Button>
              <Button>an instance</Button>
              <Button>a child</Button>
              <Button>the parent</Button>
            </ButtonGroup>
            of Record 2
          </div>
        </Grid>

      </Grid>
      <Relationship id={relation.id} />
    </div>
  )
}

export default Relationships;
