import React, { useEffect, useState } from "react";

import { list_items } from "../api";

function EditLists() {
  const [values, setValues] = useState([]);
  const [type, setType] = useState("authors");

  useEffect(() => {
    const fetchValues = async () => {
      const values = await list_items.search({
        type,
      });
      setValues(values);
    };
    fetchValues();
  }, [type]);

  return <div>{JSON.stringify(values)}</div>;
}

export default EditLists;
