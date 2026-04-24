import { zodResolver } from "@hookform/resolvers/zod";

import schemas from "../../../backend/schema/zod_schema";

// const dataSchemas = ["records", "collections", "settings"];
export default Object.keys(schemas).reduce((acc, schema) => {
  if (schema.endsWith("DataSchema")) {
    const baseName = schema.replace("DataSchema", "");
    acc[`${baseName}Validator`] = zodResolver(schemas[`${schema}`], {});
  }
  return acc;
}, {});
