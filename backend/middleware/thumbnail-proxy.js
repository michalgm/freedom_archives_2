import axios from "axios";
import fs from "fs";
import path from "path";

export default (function (app, publicPath) {
  return async function thumbnailProxy(req, res, next) {
    try {
      const imageName = req.path.split("/").pop();
      // Path to the local thumbnail
      const localThumbnailPath = path.join(publicPath, "img/thumbnails", imageName);
      if (fs.existsSync(localThumbnailPath)) {
        return res.sendFile(localThumbnailPath);
      } else {
        // If not, try to fetch it from the remote server
        const remoteUrl = `https://search.freedomarchives.org/images/thumbnails/${imageName}`;
        try {
          const response = await axios({
            method: "get",
            url: remoteUrl,
            responseType: "stream",
          });
          // Set the appropriate content type
          res.set("Content-Type", response.headers["content-type"]);
          // Pipe the image data to the response
          response.data.pipe(res);
        } catch (error) {
          // If the remote image is not found, return 404
          console.error(`Failed to fetch remote image: ${remoteUrl}`, error.message);
          res.status(404).send("Image not found");
        }
      }
    } catch (error) {
      console.error("Thumbnail proxy error:", error);
      next(error);
    }
  };
});
