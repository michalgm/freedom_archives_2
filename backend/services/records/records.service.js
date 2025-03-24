// Initializes the `records` service on path `/records`
const { KnexService } = require("@feathersjs/knex");
const hooks = require("./records.hooks");

class Records extends KnexService {}

const getOptions = (app) => ({
  Model: app.get("postgresqlClient"),
  paginate: app.get("paginate"),
  name: "records",
  id: "record_id",
  multi: true,
  operators: ["$fullText", "$contains"],
  filters: {
    $fullText: (v) => v,
    $contains: (v) => v,
  },
});
//   constructor(options) {
//     super({
//       ...options,
//       // filters: {
//       //   $fullText: (v) => v,
//       //   $contains: (v) => v,
//       // },
//       operators: ["$fullText", "$contains"],
//     });
//   }
// }

module.exports = function (app) {
  // const options = {
  //   id: "record_id",
  //   Model: app.get("postgresqlClient"),
  //   paginate: app.get("paginate"),
  //   multi: true,
  //   // filters: {
  //   //   $fullText: (v) => v,
  //   //   $contains: (v) => v,
  //   // },
  //   operators: ["$fullText", "$contains"],
  // };

  // Initialize our service with any options it requires
  app.use("/api/records", new Records(getOptions(app)));

  // Get our initialized service so that we can register hooks
  const service = app.service("api/records");

  service.hooks(hooks);
};
