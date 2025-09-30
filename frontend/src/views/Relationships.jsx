import "./Relationships.scss";

import { Box, Button, Grid2, LinearProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Section } from "src/components/ViewContainer";

import { relationships } from "../api";
import ButtonLink from "../components/ButtonLink";

import Relationship from "./Relationship";

function LinearProgressWithLabel(props) {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

function Relationships() {
  const { skip = 1 } = useParams();
  const $skip = parseInt(skip, 10);
  const [idList, setIdList] = useState([]);
  const [complete, setComplete] = useState(0);
  const [relation, setRelation] = useState({});
  const [notes, setNotes] = useState("");
  const [type, setType] = useState("");
  const [nextUnreviewed, setNextUnreviewed] = useState("");
  const navigate = useNavigate();

  // const [excludeReviewed, setExcludeReviewed] = useState(false);

  const info = {
    original: {
      desc: "All media of Record 2 will become media of Record 1, and Record 2 will be deleted",
      option: "Record 1 is the original record for record 2",
    },
    instance: {
      desc: "All media of Record 1 will become media of Record 2, and Record 1 will be deleted",
      option: "Record 2 is the original record for record 1",
    },
    child: {
      desc: "Record 1 will become a child record of Record 2",
      option: "Record 1 is a child of record 2",
    },
    parent: {
      desc: "Record 2 will become a child record of Record 1",
      option: "Record 2 is a child of record 1",
    },
    sibling: {
      desc: "Record 2 will become a child record of Record 1's parent",
      option: "Record 1 and record 2 are siblings",
    },
    continuation_parent: {
      desc: "Record 2 will become a continuation of record 1",
      option: "Record 2 is a continuation of record 1",
    },
    continuation_child: {
      desc: "Record 1 will become a continuation of record 2",
      option: "Record 1 is a continuation of record 2",
    },
    unknown: {
      desc: "The relationship between these documents will require further review",
      option: "Unknown relationship",
    },
  };

  const fetchNextUnreviewed = async (idList) => {
    if (!idList.length) {
      return;
    }
    const query = {
      $sort: { docid_2: 1, docid_1: 1 },
      type: "",
      $limit: 1,
      $select: ["id"],
    };
    const { data, total } = await relationships.find({ query });
    const nextUnreviewed = data.length ? idList.indexOf(data[0].id) + 1 : null;
    setNextUnreviewed(nextUnreviewed);
    setComplete(100 - (total / idList.length) * 100);
    return nextUnreviewed;
  };

  useEffect(() => {
    const fetchIDs = async () => {
      const { data } = await relationships.find({
        query: {
          $sort: { docid_2: 1, docid_1: 1 },
          $limit: 100000,
          $select: ["id"],
        },
      });
      const idList = data.map((r) => r.id);
      setIdList(idList);
      await fetchNextUnreviewed(idList);
    };

    fetchIDs();
  }, []);

  useEffect(() => {
    if (!idList.length) {
      return;
    }
    const fetchRelation = async () => {
      const id = idList[$skip - 1];
      if (id) {
        const relation = await relationships.get(id);
        setRelation(relation);
        setType(relation.type);
        setNotes(relation.notes);
      } else {
        //empty
      }
    };
    fetchRelation();
  }, [$skip, idList]);

  if (!relation.docid_1) {
    return null;
  }

  const setRelationType = async () => {
    await relationships.patch(relation.id, { type, notes });
    const next = await fetchNextUnreviewed(idList);
    navigate(`/relationships/${next}`);
  };

  const updateNotes = (event) => {
    setNotes(event.target.value);
  };

  return (
    <Stack direction={"column"} className="relationships" sx={{ height: "100%" }} spacing={2}>
      <Section
        header
        elements={[
          <Grid2 size={12} key={"header"}>
            <Grid2 container spacing={2} justifyContent="center" alignItems="flex-start" direction="row">
              <Grid2 size={12} style={{ paddingBottom: 0 }}>
                <LinearProgressWithLabel value={complete} />
              </Grid2>
              <Grid2 size={12}>
                <ButtonLink to={`/relationships/${$skip - 1}`} disabled={$skip <= 1}>
                  Prev
                </ButtonLink>
                {$skip} out of {idList.length}
                <ButtonLink to={`/relationships/${$skip + 1}`} disabled={$skip >= idList.length + 1}>
                  Next
                </ButtonLink>
                <ButtonLink to={`/relationships/${nextUnreviewed}`} disabled={!nextUnreviewed}>
                  Next Unreviewed
                </ButtonLink>
                <div></div>
              </Grid2>
              <Grid2 size={6}>
                <Stack spacing={1}>
                  <TextField
                    select
                    fullWidth={true}
                    value={type}
                    size="small"
                    label="Relationship Type"
                    placeholder="Relationship Type"
                    onChange={(event) => setType(event.target.value)}
                  >
                    {Object.keys(info).map((value) => (
                      <MenuItem key={value} value={value}>
                        {info[value].option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="caption">{info[type]?.desc}</Typography>
                  <div>
                    <Button
                      variant="contained"
                      disabled={!type}
                      color="primary"
                      onClick={setRelationType}
                      fullWidth={false}
                    >
                      Save Relation Type
                    </Button>
                  </div>
                  {relation.user && (
                    <Typography variant="caption">
                      Updated at <b>{new Date(relation.updated_at).toLocaleString()} </b>
                      by <b>{relation.user}</b>
                    </Typography>
                  )}
                </Stack>
              </Grid2>
              <Grid2 size={6}>
                <TextField
                  variant="outlined"
                  value={notes}
                  label="Relationship Notes"
                  rows={5}
                  multiline={true}
                  onChange={updateNotes}
                  fullWidth
                />
              </Grid2>
            </Grid2>
          </Grid2>,
        ]}
      />
      <div className="flex-container">
        <Grid2 size={12} className="flex-container">
          <Relationship id={relation.id} key={relation.id} />
        </Grid2>
      </div>
    </Stack>
  );
}

export default Relationships;
