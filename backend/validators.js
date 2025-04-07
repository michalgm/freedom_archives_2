// For more information about this file see https://dove.feathersjs.com/guides/cli/validators.html
const { Ajv, addFormats } = require("@feathersjs/schema");
const addErrors = require("ajv-errors");
const {
  recordsSchema,
  recordsDataSchema,
  collectionsSchema,
  collectionsDataSchema,
  listItemsSchema,
  archivesSchema,
  instancesSchema,
  usersSchema,
  recordItemSchema,
  collectionItemSchema,
  instanceDataSchema,
} = require("./services/schema");
const { Type, getValidator, querySyntax } = require("@feathersjs/typebox");

const formats = [
  "date-time",
  "time",
  "date",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uuid",
  "uri-template",
  "json-pointer",
  "relative-json-pointer",
  "regex",
];

const dataValidator = addErrors(
  addFormats(
    new Ajv({
      removeAdditional: true,
      allErrors: true,
    }),
    formats
  )
);

const queryValidator = addErrors(
  addFormats(
    new Ajv({
      coerceTypes: true,
      verbose: true,
      allErrors: true,
    }),
    formats
  )
);

[
  archivesSchema,
  listItemsSchema,
  instancesSchema,
  usersSchema,
  recordItemSchema,
  collectionItemSchema,
  instanceDataSchema,
].forEach((schema) => {
  dataValidator.addSchema(schema);
  queryValidator.addSchema(schema);
});

const recordsValidator = getValidator(recordsSchema, dataValidator);
const recordsDataValidator = getValidator(recordsDataSchema, dataValidator);
const collectionsValidator = getValidator(collectionsSchema, dataValidator);
const collectionsDataValidator = getValidator(collectionsDataSchema, dataValidator);

queryValidator.addSchema(recordsSchema);
queryValidator.addSchema(collectionsSchema);

// querySyntax(recordsSchema, {
//   keywords_text: {
//     $ilike: Type.String(),
//   },
// }),
const buildQuerySyntax = (schema) => {
  const props = Object.entries(schema.properties).reduce((acc, [key, value]) => {
    if (value.type === "string") {
      acc[key] = {
        $ilike: Type.String(),
        $fulltext: Type.String(),
      };
    } else if (value.type === "array") {
      acc[key] = {
        // $in: Type.Array(Type.String()),
        $contains: Type.Array(Type.String()),
        // $contained_by: Type.Array(Type.String()),
        // $overlap: Type.Array(Type.String()),
      };
    }
    return acc;
  }, {});
  return querySyntax(schema, props);
};

const recordsQueryValidator = getValidator(
  Type.Intersect([buildQuerySyntax(recordsSchema), Type.Object({})], { additionalProperties: false }),
  queryValidator
);

const collectionsQueryValidator = getValidator(
  Type.Intersect([buildQuerySyntax(collectionsSchema), Type.Object({})], { additionalProperties: false }),
  queryValidator
);

module.exports = {
  dataValidator,
  queryValidator,
  recordsValidator,
  recordsDataValidator,
  collectionsValidator,
  collectionsDataValidator,
  recordsQueryValidator,
  collectionsQueryValidator,
};
