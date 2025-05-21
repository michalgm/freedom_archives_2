import zod from "zod";

const z = zod;

// --- Basic referenced schemas ---
const settingsSchema = z.object({
  archive_id: z.number(),
  settings: z.object({
    site_intro_text: z.string().default(""),
    featured_collection_id: z.number().nullable().optional(),
  }),
});

const archivesSchema = z.object({
  archive_id: z.number(),
  title: z.string(),
});

const listItemsSchema = z.object({
  list_item_id: z.number(),
  item: z.string(),
});

const usersSchema = z.object({
  user_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  username: z.string(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })
    .nullable()
    .optional(),
  firstname: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
  role: z.enum(["user", "intern", "administrator"]),
  active: z.boolean().default(true),
  email: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
});
// .and(
//   z.object({}).superRefine(({ password, username }, ctx) => {
//     if (password) {
//       if (password.length < 8) {
//         ctx.addIssue({
//           path: ["password"],
//           code: z.ZodIssueCode.too_small,
//           message: "Password must be at least 8 characters",
//           minimum: 8,
//           type: "string",
//           inclusive: true,
//         });
//       }

//       if (password === username) {
//         ctx.addIssue({
//           path: ["password"],
//           code: z.ZodIssueCode.custom,
//           message: "Password cannot be the same as username",
//         });
//       }

//       if (/^[A-Za-z0-9]+$/.test(password)) {
//         ctx.addIssue({
//           path: ["password"],
//           code: z.ZodIssueCode.custom,
//           message: "Password must contain at least one special character",
//         });
//       }
//     }
//   })
// );

const common_modification_fields = {
  date_created: z.string().datetime().nullable().optional(),
  date_modified: z.string().datetime().nullable().optional(),
  contributor_user_id: z.number().nullable().optional(),
  contributor_username: z.string().nullable().optional(),
  contributor_name: z.string().nullable().optional(),
  creator_user_id: z.number().nullable().optional(),
  creator_username: z.string().nullable().optional(),
  creator_name: z.string().nullable().optional(),
};

// --- Instances ---
const instanceSchema = z.object({
  instance_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  record_id: z.number(),
  call_number: z
    .union([
      z.string().regex(/^([A-Z/]{1,5}|Vin) [\d.]{1,5}( ?[A-Z]| +R[123]| \d{3})?$/, {
        message: "Call number must be in format 'XX 123'",
      }),
      z.literal(""),
      z.null(),
    ])
    .nullable()
    .optional(),
  format: z.number().nullable().optional(),
  no_copies: z.number().min(1).nullable().optional().describe("Copies Count"),
  quality: z.string().nullable().optional(),
  generation: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  media_type: z.enum(["Audio", "Webpage", "Video", "PDF"]),
  generation_item: listItemsSchema.nullable().optional().describe("Generation"),
  format_item: listItemsSchema.required().describe("Format"),
  quality_item: listItemsSchema.nullable().optional().describe("Quality"),
  original_doc_id: z.number().nullable().optional(),
  is_primary: z.boolean(),
  ...common_modification_fields,
});

// --- Record ---
const recordsSchema = z.object({
  record_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  title: z.string().min(1).default(""),
  description: z.string().min(1).default(""),
  notes: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  vol_number: z.string().describe("Volume Number").nullable().optional(),
  collection_id: z.number().nullable().optional(),
  parent_record_id: z.number().nullable().optional(),
  primary_instance_id: z.number().optional(),
  year: z.number().nullable().optional(),
  month: z.number().nullable().optional(),
  day: z.number().nullable().optional(),
  publisher_id: z.number().nullable().optional(),
  program_id: z.number().nullable().optional(),
  needs_review: z.boolean().default(false),
  is_hidden: z.boolean().default(false),
  date_string: z
    .string()
    .regex(/\d{2}\/\d{2}\/\d{4}/)
    .describe("Date")
    .nullable()
    .optional(),
  // .default("00/00/0000"),
  publisher: listItemsSchema.nullable().optional(),
  program: listItemsSchema.nullable().optional(),
  instances: z.array(instanceSchema).min(1).default([]),
  has_digital: z.boolean().default(false),
  authors: z.array(listItemsSchema).nullable().optional(),
  subjects: z.array(listItemsSchema).nullable().optional(),
  keywords: z.array(listItemsSchema).nullable().optional(),
  producers: z.array(listItemsSchema).nullable().optional(),
  primary_instance_thumbnail: z.string().nullable().optional(),
  primary_instance_format: z.number().nullable().optional(),
  primary_instance_format_text: z.string().nullable().optional(),
  primary_instance_media_type: z.string().nullable().optional(),
  collection: z.lazy(() => embeddedCollectionSchema),
  children: z
    .array(z.lazy(() => embeddedRecordSchema))
    .nullable()
    .optional(),
  siblings: z
    .array(z.lazy(() => embeddedRecordSchema))
    .nullable()
    .optional(),
  parent: z
    .lazy(() => embeddedRecordSchema)
    .nullable()
    .optional(),
  continuations: z
    .array(z.lazy(() => embeddedRecordSchema))
    .nullable()
    .optional(),
  ...common_modification_fields,
});
//   .superRefine((data, ctx) => {
//     const primaryCount = data.instances.filter((i) => i.is_primary).length;
//     if (primaryCount !== 1) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: `Exactly one instance must be marked as primary`,
//         path: ["instances"],
//       });
//     }
//   });

// --- Data Schemas ---
const recordItemSchema = recordsSchema.pick({
  record_id: true,
  title: true,
});

const instanceDataSchema = instanceSchema.pick({
  instance_id: true,
  call_number: true,
  generation_item: true,
  format_item: true,
  quality_item: true,
  no_copies: true,
  url: true,
});

const recordsDataSchema = recordsSchema
  .pick({
    record_id: true,
    title: true,
    description: true,
    is_hidden: true,
    needs_review: true,
    authors: true,
    producers: true,
    keywords: true,
    subjects: true,
    vol_number: true,
    program: true,
    publisher: true,
    location: true,
    date_string: true,
    notes: true,
    primary_instance_id: true,
  })
  .extend({
    parent: recordItemSchema.nullable().optional(),
    children: z
      .array(recordItemSchema.extend({ delete: z.boolean().optional() }))
      .nullable()
      .optional(),
    continuations: z.array(recordItemSchema).nullable().optional(),
    collection: z.lazy(() => collectionItemSchema),
    instances: z.array(instanceDataSchema).min(1, { message: "At least one media item is required" }),
  });

const embeddedRecordSchema = recordsSchema
  .pick({
    record_id: true,
    title: true,
    is_hidden: true,
    parent_record_id: true,
    primary_instance_thumbnail: true,
    primary_instance_format: true,
    primary_instance_format_text: true,
    primary_instance_media_type: true,
    collection: z.lazy(() => embeddedCollectionSchema),
  })
  .extend({ record_id: z.number(), delete: z.boolean().optional() });

const collectionsSchema = z.object({
  collection_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  parent_collection_id: z.number().nullable().optional(),
  collection_name: z.string(),
  description: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  call_number: z.string().nullable().optional(),
  publisher_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  display_order: z.number().nullable().optional(),
  needs_review: z.boolean().default(false),
  is_hidden: z.boolean().default(false),
  publisher: listItemsSchema.nullable().optional(),
  subjects: z.array(listItemsSchema).nullable().optional(),
  keywords: z.array(listItemsSchema).nullable().optional(),
  child_records: z.array(embeddedRecordSchema),
  featured_records: z.array(embeddedRecordSchema),
  parent: z.lazy(() => embeddedCollectionSchema),
  children: z.array(z.lazy(() => embeddedCollectionSchema)),
  ...common_modification_fields,
});

const embeddedCollectionSchema = collectionsSchema.pick({
  collection_id: true,
  collection_name: true,
  call_number: true,
  thumbnail: true,
  display_order: true,
  is_hidden: true,
  summary: true,
  //   parent: collectionItemSchema.nullable().optional(),
});

const collectionItemSchema = collectionsSchema.pick({
  collection_id: true,
  collection_name: true,
});

const collectionsDataSchema = collectionsSchema
  .pick({
    collection_name: true,
    description: true,
    summary: true,
    call_number: true,
    notes: true,
    thumbnail: true,
    display_order: true,
    needs_review: true,
    is_hidden: true,
    creator_username: true,
    publisher: true,
    subjects: true,
    keywords: true,
  })
  .extend({
    child_records: z.array(recordItemSchema).nullable().optional(),
    parent: collectionItemSchema.nullable().optional(),
    children: z.array(collectionItemSchema).nullable().optional(),
    featured_records: z.array(recordItemSchema).nullable().optional(),
  });

export default {
  archivesSchema,
  listItemsSchema,
  usersSchema,
  recordsSchema,
  recordsDataSchema,
  collectionsSchema,
  collectionsDataSchema,
  settingsSchema,
  settingsDataSchema: settingsSchema,
};
