import { KnexService, transaction } from "@feathersjs/knex";

import { rankedSearch } from "./common_hooks/rankedSearch.js";

class DuplicateRecords extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "duplicate_records",
    });
  }
}

const getRecordIds = (context) => {
  const { id } = context;
  const [record_id_1, record_id_2] = id.split('%7C');
  if (!record_id_1 || !record_id_2) {
    throw new Error("invalid duplicate record id");
  }
  return [record_id_1, record_id_2];
};

export default (function (app) {
  const options = {
    id: "duplicate_record_id",
    Model: app.get("postgresqlClient"),
    paginate: { ...app.get("paginate"), max: false },
    multi: true,
    operators: ["$fullText", "$contains"],
  };
  // Initialize our service with any options it requires
  app.use("/api/duplicate_records", new DuplicateRecords(options), {
    methods: ["find", "patch", "remove"],
  });
  // Get our initialized service so that we can register hooks
  const service = app.service("api/duplicate_records");

  const ignoreDuplicateRecord = async (context) => {
    const { id } = context;
    const [record_id_1, record_id_2] = getRecordIds(context);

    const knex = context.app.get('postgresqlClient');
    await knex.table('duplicate_records_ignore').insert({ record_id_1, record_id_2 });

    context.result = {
      id,
    };
    return context;
  };


  const mergeDuplicateRecords = async (context) => {
    const { data } = context;
    const [record_id_1, record_id_2] = getRecordIds(context);
    // console.log('Merging duplicate records:', record_id_1, record_id_2, data);
    const res = await context.app.service('/api/records').patch(record_id_1, data);
    await context.app.service('/api/records').remove(record_id_2);
    context.result = {
      ...res,
    };
    return context;
  };

  service.hooks({
    before: {
      all: [transaction.start()],
      find: [rankedSearch],
      patch: [mergeDuplicateRecords],
      remove: [ignoreDuplicateRecord],
    },
    after: {
      all: [transaction.end()],
      find: [],
      patch: [],
      remove: [],
    },
    error: {
      all: [transaction.rollback()],
      find: [],
      patch: [],
      remove: [],
    },
  });
});