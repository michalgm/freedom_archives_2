import { FetchClient } from "@feathersjs/rest-client";
import auth from "@feathersjs/authentication-client";
import { feathers } from "@feathersjs/feathers";
import qs from "qs";
import rest from "@feathersjs/rest-client";

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
export const value_lookup = app.service("/api/value_lookup");
export const users = app.service("/api/users");
export const list_items_lookup = app.service("/api/list_items_lookup");

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
  value_lookup,
};

export const getAuthentication = app.get("/api/authentication");
