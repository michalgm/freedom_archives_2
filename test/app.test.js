// For more information about this file see https://dove.feathersjs.com/guides/cli/app.test.html
import assert from "assert";
import axios from "axios";

import app from "../backend/app.js";

const port = app.get("port");
const appUrl = `http://${app.get("host")}:${port}`;

describe("Feathers application tests", () => {

  before(async () => {
    await app.listen(port);
  });

  after(async () => {
    await app.teardown();
  });

  it("starts and shows the index page", async () => {
    const { data } = await axios.get(appUrl);

    assert.ok(data.indexOf('<html lang="en">') !== -1);
  });

  // it("shows a 404 JSON error", async () => {
  //   try {
  //     const res = await axios.get(`${appUrl}/path/to/nowhere`, {
  //       responseType: "json",
  //     });
  //     console.log(res);
  //     assert.fail("should never get here");
  //   } catch (error) {
  //     const { response } = error;
  //     console.log(error);
  //     assert.strictEqual(response?.status, 404);
  //     assert.strictEqual(response?.data?.code, 404);
  //     assert.strictEqual(response?.data?.name, "NotFound");
  //   }
  // });
});
