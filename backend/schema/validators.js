import { BadRequest } from "@feathersjs/errors";

import zodSchemas from "./zod_schema.js";

// Create a Zod validator adapter for Feathers
const createZodValidator = (schema) => {
  return (data) => {
    try {
      const result = schema.parse(data);
      return { value: result };
    } catch (error) {
      return { error };
    }
  };
};

// Create validators for each schema
const recordsValidator = createZodValidator(zodSchemas.recordsSchema);
const recordsDataValidator = createZodValidator(zodSchemas.recordsDataSchema);
const collectionsValidator = createZodValidator(zodSchemas.collectionsSchema);
const collectionsDataValidator = createZodValidator(zodSchemas.collectionsDataSchema);
const usersValidator = createZodValidator(zodSchemas.usersSchema);
// Add more validators as needed

export { recordsValidator, recordsDataValidator, collectionsValidator, collectionsDataValidator, usersValidator };

export const validateWithZod = (validator) => {
  return async (context) => {
    const { data } = context;

    if (data) {
      const { error, value } = validator(data);

      if (error) {
        // Format Zod v4 errors for client consumption - use .issues property
        const errors = error.issues || error.errors || [];
        const formattedErrors = errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        throw new BadRequest("Validation failed", { errors: formattedErrors });
      }

      // Replace with validated and potentially transformed data
      context.data = value;
    }

    return context;
  };
};
