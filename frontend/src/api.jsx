import auth from "@feathersjs/authentication-client";
import { feathers } from "@feathersjs/feathers";
import rest, { FetchClient } from "@feathersjs/rest-client";
import qs from "qs";

export const app = feathers();

class MyFetchClient extends FetchClient {
  getQuery(query) {
    if (Object.keys(query).length !== 0) {
      const queryString = qs.stringify(query, {
        strictNullHandling: true,
      });
      return `?${queryString}`;
    }
    return "";
  }
}

const restClient = rest();

app.configure(restClient.fetch(window.fetch.bind(window), MyFetchClient));
app.configure(auth({ path: "/api/authentication" }));

export const records = app.service("/api/records");

export const relationships = app.service("/api/relationships");

export const authentication = app.service("/api/authentication");

export const list_items = app.service("/api/list_items");

export const collections = app.service("/api/collections");

export const users = app.service("/api/users");

export const list_items_lookup = app.service("/api/list_items_lookup");

export const review_changes = app.service("/api/review_changes");

export const public_records = app.service("/api/public/records");

export const public_settings = app.service("/api/public/settings");
export const public_collections = app.service("/api/public/collections");

export const snapshots = app.service("/api/snapshots");

export const settings = app.service("/api/settings");

export const unified_search = app.service("/api/unified_search");

export const getServiceID = (service) => `${service.replace(/s$/, "")}_id`;

export const authenticate = async (username, password) => {
  return app
    .authenticate({
      strategy: "local",
      username,
      password,
    })
    .catch((e) => {
      // Show login page (potentially with `e.message`)
      console.error("Authentication error", e);
      return Promise.reject(e);
    });
};

export const reAuth = app.reAuthenticate;

export const services = {
  records,
  relationships,
  list_items,
  collections,
  users,
  list_items_lookup,
  review_changes,
  public_records,
  snapshots,
  settings,
  public_settings,
};

export const getAuthentication = app.get("/api/authentication");
