import typebox from "@feathersjs/typebox";
// import { resolve } from "@feathersjs/schema";
const { StringEnum, Type } = typebox;
const archivesSchema = Type.Object(
  {
    archive_id: Type.Number(),
    title: Type.String(),
  },
  {
    $id: "archive_id",
  }
);
const listItemsSchema = Type.Object(
  {
    list_item_id: Type.Number(),
    item: Type.String(),
  },
  {
    $id: "list_item",
  }
);
const usersSchema = Type.Object(
  {
    user_id: Type.Number(),
    archive_id: Type.Ref(archivesSchema),
    username: Type.String(),
    firstname: Type.Optional(Type.String()),
    lastname: Type.Optional(Type.String()),
    role: StringEnum(["user", "intern", "administrator"]),
    active: Type.Boolean(),
    email: Type.Optional(Type.String()),
    full_name: Type.Optional(Type.String()),
    user_search: Type.Optional(Type.String()),
  },
  {
    $id: "user",
  }
);
const mediaTypeSchema = StringEnum(["Audio", "Webpage", "Video", "PDF"]);
const instancesSchema = Type.Object(
  {
    instance_id: Type.Number(),
    archive_id: Type.Number(),
    record_id: Type.Number(),
    call_number: Type.String(),
    format: Type.Number(),
    no_copies: Type.Optional(Type.Number()),
    quality: Type.Optional(Type.String()),
    generation: Type.Optional(Type.String()),
    url: Type.Optional(Type.String({ format: "uri" })),
    thumbnail: Type.Optional(Type.String()),
    media_type: mediaTypeSchema,
    generation_item: Type.Optional(Type.Ref(listItemsSchema)),
    format_item: Type.Optional(Type.Ref(listItemsSchema)),
    quality_item: Type.Optional(Type.Ref(listItemsSchema)),
    date_created: Type.String({ format: "date-time" }),
    date_modified: Type.String({ format: "date-time" }),
    date_string: Type.Optional(Type.String()),
    original_doc_id: Type.Optional(Type.Number()),
    contributor_user_id: Type.Ref(usersSchema),
    contributor_username: Type.Optional(Type.String()),
    creator_user_id: Type.Ref(usersSchema),
    contributor_name: Type.Optional(Type.String()),
    creator_username: Type.Optional(Type.String()),
    creator_name: Type.Optional(Type.String()),
    is_primary: Type.Boolean(),
  },
  {
    $id: "instance",
  }
);
const recordsSchema = Type.Recursive((record) =>
  Type.Object(
    {
      record_id: Type.Number(),
      archive_id: Type.Ref(archivesSchema),
      title: Type.String({ minLength: 1 }),
      description: Type.String({ minLength: 2, errorMessage: "bloop" }),
      notes: Type.Optional(Type.String()),
      location: Type.Optional(Type.String()),
      vol_number: Type.Optional(Type.String()),
      collection_id: Type.Number(),
      parent_record_id: Type.Optional(Type.Number()),
      primary_instance_id: Type.Optional(Type.Number()),
      year: Type.Optional(Type.Number()),
      month: Type.Optional(Type.Number()),
      day: Type.Optional(Type.Number()),
      publisher_id: Type.Optional(Type.Number()),
      program_id: Type.Optional(Type.Number()),
      needs_review: Type.Boolean({ default: false }),
      is_hidden: Type.Boolean({ default: false }),
      publish_to_global: Type.Boolean(),
      creator_user_id: Type.Ref(usersSchema),
      contributor_user_id: Type.Ref(usersSchema),
      date_created: Type.String({ format: "date-time" }),
      date_modified: Type.String({ format: "date-time" }),
      date_string: Type.Optional(Type.RegEx(/\d\d\/\d\d\/\d\d\d\d/)),
      date: Type.Optional(Type.String({ format: "date-time" })),
      publisher: Type.Optional(Type.Ref(listItemsSchema)),
      program: Type.Optional(Type.Ref(listItemsSchema)),
      instances: Type.Array(Type.Ref(instancesSchema), {
        minItems: 1,
      }),
      has_digital: Type.Boolean(),
      instance_count: Type.Optional(Type.Number()),
      contributor_name: Type.Optional(Type.String()),
      contributor_username: Type.Optional(Type.String()),
      creator_name: Type.Optional(Type.String()),
      creator_username: Type.Optional(Type.String()),
      call_numbers: Type.Array(Type.String()),
      formats: Type.Array(Type.Number()),
      qualitys: Type.Array(Type.Number()),
      generations: Type.Array(Type.Number()),
      media_types: Type.Array(mediaTypeSchema),
      authors: Type.Array(Type.Ref(listItemsSchema)),
      subjects: Type.Array(Type.Ref(listItemsSchema)),
      keywords: Type.Array(Type.Ref(listItemsSchema)),
      producers: Type.Array(Type.Ref(listItemsSchema)),
      authors_text: Type.Optional(Type.String()),
      subjects_text: Type.Optional(Type.String()),
      keywords_text: Type.Optional(Type.String()),
      producers_text: Type.Optional(Type.String()),
      authors_search: Type.Optional(Type.Array(Type.String())),
      subjects_search: Type.Optional(Type.Array(Type.String())),
      keywords_search: Type.Optional(Type.Array(Type.String())),
      producers_search: Type.Optional(Type.Array(Type.String())),
      fullText: Type.Optional(Type.String()),
      primary_instance_thumbnail: Type.Optional(Type.String()),
      primary_instance_format: Type.Optional(Type.Number()),
      primary_instance_format_text: Type.Optional(Type.String()),
      primary_instance_media_type: Type.Optional(Type.String()),
      collection: Type.Object({}),
      children: Type.Array(record, { default: [] }),
      siblings: Type.Array(record, { default: [] }),
      parent: Type.Optional(record),
      continuations: Type.Array(record, { default: [] }),
    },
    {
      $id: "record",
    }
  )
);
const recordItemSchema = Type.Pick(recordsSchema, ["record_id", "title"], { $id: "recordItem" });
const collectionsSchema = Type.Recursive((collection) =>
  Type.Object(
    {
      collection_id: Type.Number(),
      archive_id: Type.Ref(archivesSchema),
      parent_collection_id: Type.Optional(Type.Number()),
      collection_name: Type.String(),
      description: Type.Optional(Type.String()),
      summary: Type.Optional(Type.String()),
      call_number: Type.Optional(Type.String()),
      publisher_id: Type.Optional(Type.Number()),
      notes: Type.Optional(Type.String()),
      thumbnail: Type.Optional(Type.String()),
      display_order: Type.Optional(Type.Number()),
      needs_review: Type.Boolean(),
      is_hidden: Type.Boolean(),
      publish_to_global: Type.Boolean(),
      creator_user_id: Type.Ref(usersSchema),
      contributor_user_id: Type.Ref(usersSchema),
      date_created: Type.String({ format: "date-time" }),
      date_modified: Type.String({ format: "date-time" }),
      contributor_name: Type.Optional(Type.String()),
      contributor_username: Type.Optional(Type.String()),
      creator_name: Type.Optional(Type.String()),
      creator_username: Type.Optional(Type.String()),
      publisher: Type.Ref(listItemsSchema),
      subjects: Type.Array(Type.Ref(listItemsSchema)),
      keywords: Type.Array(Type.Ref(listItemsSchema)),
      subjects_text: Type.Optional(Type.String()),
      keywords_text: Type.Optional(Type.String()),
      child_records: Type.Array(Type.Ref(recordsSchema)),
      featured_records: Type.Array(Type.Ref(recordsSchema)),
      parent: collection,
      children: Type.Array(collection),
    },
    {
      $id: "collection",
    }
  )
);
const collectionItemSchema = Type.Pick(collectionsSchema, ["collection_id", "collection_name"], {
  $id: "collectionItem",
});
const instanceDataSchema = Type.Pick(
  instancesSchema,
  ["instance_id", "call_number", "is_primary", "generation_item", "format_item", "quality_item", "no_copies", "url"],
  {
    $id: "instanceItem",
  }
);
// const Common = Type.Box([recordItemSchema, collectionItemSchema]);
const recordsDataSchema = Type.Intersect(
  [
    Type.Pick(recordsSchema, [
      "title",
      "description",
      "is_hidden",
      "needs_review",
      "authors",
      "producers",
      "keywords",
      "subjects",
      "vol_number",
      "program",
      "publisher",
      "location",
      "year",
      "month",
      "day",
      "notes",
    ]),
    Type.Partial(
      Type.Object({
        parent: Type.Ref(recordItemSchema),
        children: Type.Array(Type.Ref(recordItemSchema)),
        continuations: Type.Array(Type.Ref(recordItemSchema)),
        collection: Type.Ref(collectionItemSchema),
        instances: Type.Array(Type.Ref(instanceDataSchema)),
      })
    ),
  ],
  { $id: "recordData" }
);
const collectionsDataSchema = Type.Pick(
  collectionsSchema,
  [
    "collection_name",
    "description",
    "summary",
    "call_number",
    "notes",
    "thumbnail",
    "display_order",
    "needs_review",
    "is_hidden",
    "publish_to_global",
    "creator_username",
    "publisher",
    "subjects",
    "keywords",
    "child_records",
    "featured_records",
    "parent",
    "children",
  ],
  { $id: "collectionData" }
);
export {
  archivesSchema,
  collectionItemSchema,
  collectionsDataSchema,
  collectionsSchema,
  instanceDataSchema,
  instancesSchema,
  listItemsSchema,
  mediaTypeSchema,
  recordItemSchema,
  recordsDataSchema,
  recordsSchema,
  usersSchema,
};
export default {
  recordsSchema,
  recordsDataSchema,
  collectionsSchema,
  collectionsDataSchema,
  archivesSchema,
  listItemsSchema,
  mediaTypeSchema,
  instancesSchema,
  usersSchema,
  recordItemSchema,
  collectionItemSchema,
  instanceDataSchema,
};
