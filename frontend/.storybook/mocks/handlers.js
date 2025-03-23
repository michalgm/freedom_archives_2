import { http, HttpResponse } from "msw";

// Create handlers based on your API endpoints
export const handlers = [
  http.get("/api/collections", () => {
    return HttpResponse.json([
      { collection_id: 1, collection_name: "Mock Collection 1" },
      { collection_id: 2, collection_name: "Mock Collection 2" },
    ]);
  }),

  http.get("/api/records", () => {
    return HttpResponse.json({
      data: [
        {
          record_id: 1,
          title: "Mock Record",
          primary_instance_thumbnail: "thumbnail.jpg",
          primary_instance_format_text: "PDF",
        },
      ],
      total: 1,
    });
  }),

  http.get("/api/list_items", ({ request }) => {
    const url = new URL(request.url);
    const item = url.searchParams.get("item");
    console.log(url);
    console.log(item);
    if (item?.match("new")) {
      return HttpResponse.json({
        total: 0,
        limit: 15,
        skip: 0,
        data: [],
      });
    }

    return HttpResponse.json({
      total: 829,
      limit: 15,
      skip: 0,
      data: [
        { list_item_id: 157, item: "Abasi Ganda and Kamau M. Askari" },
        { list_item_id: 159, item: "Abbe Sudvarg" },
        { list_item_id: 16600, item: "abdelbaki hermassi" },
        { list_item_id: 165, item: "Abdel-Rahim Omran" },
        { list_item_id: 166, item: "Abdelwahab M. Elmessiri" },
        { list_item_id: 167, item: "Abdul Alkalimat" },
        { list_item_id: 173, item: "Abdul Olugbala Shakur" },
        { list_item_id: 71, item: "A. Clare Brandabur" },
        { list_item_id: 236, item: "Adam Hochschild" },
        { list_item_id: 247, item: "Adjoa Aiyetoro" },
        { list_item_id: 252, item: "Adolfo Matos" },
        { list_item_id: 259, item: "Adrian DeWind" },
        { list_item_id: 338, item: "Agee & Hosenball Defence Committee" },
        { list_item_id: 364, item: "Agusto C. Sandino Foundation" },
        { list_item_id: 370, item: "Ahmed Obafemi" },
      ],
    });
  }),

  http.post("/api/list_items", async ({ request }) => {
    const newItem = await request.json();
    return HttpResponse.json(newItem);
  }),

  // Add more handlers for other endpoints
];
