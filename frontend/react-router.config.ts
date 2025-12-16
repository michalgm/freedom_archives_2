import type { Config } from "@react-router/dev/config";

// import { public_collections } from "./src/api.js";

// app.configure(services);

// async function fetchCollectionIds() {
//   const collections = await public_collections.find({
//     query: {
//       $select: [
//         'collection_id'],
//     },
//   })

//   return collections.map(collection => collection.collection_id);
// }

export default {
  appDirectory: "src",
  ssr: true,
  // prerender: async () => {
  //   const collections = await fetchCollectionIds();
  //   return ["/", ...collections.map(id => `/collections/${id}`)];
  // },
} satisfies Config;
