import app from "../app.js";

async function publishSite() {
  await app.service(`api/snapshots`).create({}, { user: { user_id: 1, archive_id: 1 } });
  await app.teardown();
  // console.log("App torn down");
  process.exit(0);
}

publishSite();
export default publishSite;
