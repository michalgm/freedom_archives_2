import zod from "zod";

const z = zod;

const callNumberSuffixSchema = z.union([
  z.string().regex(/^[\d.]{1,5}([A-Z]| +R[\d])?$/, {
    message: "Call number suffix must be in format '123' or '123A' or '123 R1'",
  }),
  z.literal(""),
  z.null(),
])
  .nullable()
  .optional();

// --- Basic referenced schemas ---
const settingsSchema = z.object({
  archive_id: z.number(),
  settings: z.object({
    site_intro_text: z.string().default(""),
    featured_collection_id: z.string().nullable().optional(),
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
const instancesSchema = z.object({
  instance_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  record_id: z.number(),
  call_number_id: z.number().nullable().optional(),
  call_number_suffix: callNumberSuffixSchema,
  format_id: z.number().nullable().optional(),
  no_copies: z.number().min(1).nullable().optional().describe("Copies Count"),
  quality_id: z.number().nullable().optional(),
  generation_id: z.number().nullable().optional(),
  url: z.union([z.string().url({ message: "Must be a valid URL" }), z.literal(""), z.null()]).nullable().optional(),
  // url: z.string().url().nullable(),
  thumbnail: z.string().nullable().optional(),
  media_type: z.enum(["Audio", "Webpage", "Image", "Video", "PDF"]),
  call_number_item: listItemsSchema.nullable().optional().describe("Call Number"),
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
    .nullable()
    .optional()
    .superRefine((val, ctx) => {
      if (!val || val === "") return; // Allow empty/null

      const parts = val.split('/');
      if (parts.length !== 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date must be in MM/DD/YYYY format"
        });
        return;
      }

      const [month, day, year] = parts.map(Number);

      // Validate month
      if (month !== 0 && (month < 1 || month > 12)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Month must be 00 (unknown) or 01-12"
        });
      }

      // Validate day
      if (day !== 0 && (day < 1 || day > 31)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day must be 00 (unknown) or 01-31"
        });
      }

      // Validate year
      if (year != 0 && (year < 1920 || year > 2100)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Year must be between 1920 and 2100"
        });
      }
    })
    .describe("Date"),
  year_is_circa: z.boolean().default(false).describe("Approximate Date"),
  publisher: listItemsSchema.nullable().optional(),
  program: listItemsSchema.nullable().optional(),
  instances: z.array(instancesSchema).describe('Media').min(1).default([]),
  has_digital: z.boolean().default(false),
  authors: z.array(listItemsSchema).nullable().optional(),
  subjects: z.array(listItemsSchema).nullable().optional(),
  keywords: z.array(listItemsSchema).nullable().optional(),
  producers: z.array(listItemsSchema).nullable().optional(),
  primary_instance_thumbnail: z.string().nullable().optional(),
  primary_instance_format_id: z.number().nullable().optional(),
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

const instancesDataSchema = instancesSchema.pick({
  instance_id: true,
  call_number_item: true,
  call_number_suffix: true,
  generation_item: true,
  format_item: true,
  quality_item: true,
  no_copies: true,
  url: true,
}).refine((data) => {
  return !data.call_number_item || data.call_number_suffix;
}, {
  message: "Required if call number class is provided",
  path: ["call_number_suffix"],
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
    year_is_circa: true,
    notes: true,
    primary_instance_id: true,
  })
  .extend({
    parent: recordItemSchema.nullable().optional().describe('Parent Record'),
    children: z
      .array(recordItemSchema.extend({ delete: z.boolean().optional() }))
      .describe('Child Records')
      .nullable()
      .optional(),
    continuations: z.array(recordItemSchema).nullable().optional(),
    collection: z.lazy(() => collectionItemSchema),
    instances: z.array(instancesDataSchema).describe('Media').min(1, { message: "At least one media item is required" }),
  });

const embeddedRecordSchema = recordsSchema
  .pick({
    record_id: true,
    title: true,
    is_hidden: true,
    parent_record_id: true,
    primary_instance_thumbnail: true,
    primary_instance_format_id: true,
    primary_instance_format_text: true,
    primary_instance_media_type: true,
    collection: z.lazy(() => embeddedCollectionSchema),
  })
  .extend({ record_id: z.number(), delete: z.boolean().optional() });

const collectionsSchema = z.object({
  collection_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  parent_collection_id: z.number().nullable().optional(),
  collection_name: z.string().min(1),
  description: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  call_number_id: z.number().nullable().optional(),
  call_number_suffix: callNumberSuffixSchema,
  publisher_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  display_order: z.number().nullable().optional(),
  needs_review: z.boolean().default(false),
  is_hidden: z.boolean().default(false),
  call_number_item: listItemsSchema.nullable().optional().describe("Call Number"),
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
    call_number_suffix: true,
    call_number_item: true,
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
    parent: collectionItemSchema.nullable().optional().describe('Parent Collection'),
    children: z.array(collectionItemSchema).nullable().optional().describe('Child Collections'),
    featured_records: z.array(recordItemSchema).nullable().optional(),
  });

export default {
  archivesSchema,
  listItemsSchema,
  usersSchema,
  recordsSchema,
  recordsDataSchema,
  instancesSchema,
  instancesDataSchema,
  collectionsSchema,
  collectionsDataSchema,
  settingsSchema,
  settingsDataSchema: settingsSchema,
};
