import { Grid, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

import { relationships } from "../api";
import { Field } from "../components/form/Field";
import Form from "../components/form/Form";
import Link from "../components/Link";
import Record from "../components/Record";

function Relationship({ id }) {
  const [relation, setRelation] = useState({});

  useEffect(() => {
    const fetchRelations = async () => {
      const relation = await relationships.get(id);
      setRelation(relation || {});
    };
    fetchRelations();
  }, [id]);

  if (!relation.docid_1) {
    return null;
  }

  return (
    <div>
      <Grid container spacing={2}>
        {[1, 2].map((num) => {
          const other_num = num === 1 ? 2 : 1;
          const defaultValues = {
            title: relation[`title_${other_num}`],
            description: relation[`description_${other_num}`],
            track_number: relation[`track_number_${other_num}`],
          };
          return (
            <Grid size={6} key={num}>
              <Paper>
                <Form defaultValues={defaultValues}>
                  <Stack direction="row" spacing={2} justifyContent="space-between">
                    <Typography variant="h4">Record {num}</Typography>
                    <Typography variant="subtitle1">
                      <Link to={`/records/${relation[`docid_${num}`]}`}>(ID {relation[`docid_${num}`]})</Link>
                      <Link
                        target="_blank"
                        href={`https://search-old.freedomarchives.org/admin/#/documents/${relation[`docid_${num}`]}`}
                      >
                        (Old DB Link)
                      </Link>
                    </Typography>
                  </Stack>
                  <Field
                    ro={true}
                    multiline
                    variant="filled"
                    name="title"
                    label="Relation Title"
                    inputProps={{ style: { minHeight: "0px" } }}
                  />
                  <Field ro={true} multiline variant="filled" name="description" label="Relation description" />
                  <Field
                    ro={true}
                    field_type="number"
                    variant="filled"
                    name="track_number"
                    label="Relation Track Number"
                  />
                </Form>
              </Paper>
            </Grid>
          );
        })}

        {[1, 2].map((num) => (
          <Grid size={6} key={num}>
            <Paper>
              <div style={{ padding: 4 }}>
                <Record id={relation[`docid_${num}`]} ro embedded />
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default React.memo(Relationship);
