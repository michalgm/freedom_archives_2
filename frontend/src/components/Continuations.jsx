import { Delete, KeyboardArrowDown, KeyboardArrowUp, Restore } from '@mui/icons-material'
import { FieldArray, useFormikContext } from "formik";
import {
  Grid,
  IconButton,
} from "@mui/material/";

import Field from "../components/Field";
import React from 'react'
import { RecordsList } from '../components/RecordItem'

function Continuations() {

  const { values, setFieldValue } = useFormikContext();
  return (
    <FieldArray
      name="continuations"
      render={({ push, move }) => {
        const continuations = values.continuations.map((child = {}, index) => {
          if (!child) {
            return null
          }
          child.action = () => (
            <Grid container direction="column">
              <IconButton
                onClick={() =>
                  move(index, index - 1)
                }
                disabled={index === 0}
                size="small"
              >
                <KeyboardArrowUp fontSize="inherit" />
              </IconButton>
              <IconButton

                onClick={() =>
                  setFieldValue(
                    `continuations[${index}].delete`,
                    !child.delete
                  )
                }
                size="small"
              >
                {child.delete ? <Restore fontSize="inherit" /> : <Delete fontSize="inherit" />}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  move(index, index + 1)
                }
                disabled={index === continuations.length - 1}
              >
                <KeyboardArrowDown fontSize="inherit" />
              </IconButton>
            </Grid>
          )
          return child;
        })

        return (
          <>
            <RecordsList records={continuations} emptyText="No Related Continuations" />
            <Field
              name='new_continuation'
              type="select"
              searchType="records"
              size="small"
              clearOnChange
              managed
              excludeIds={[values.record_id, ...values.continuations.map(({ record_id }) => record_id)]}
              onChange={(_, child) => {
                if (child) {
                  push(child);
                }
              }}
            />
          </>
        );
      }}
    />
  );
}


export default Continuations