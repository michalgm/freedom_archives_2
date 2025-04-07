import { zodResolver } from "@hookform/resolvers/zod";
import schemas from "../../../backend/services/zod_schema";

const dataSchemas = ["records", "collections", "settings"];
export default dataSchemas.reduce((acc, schema) => {
  logger.log(schema, schemas[`${schema}DataSchema`]);
  acc[`${schema}Validator`] = zodResolver(schemas[`${schema}DataSchema`], {});
  return acc;
}, {});
