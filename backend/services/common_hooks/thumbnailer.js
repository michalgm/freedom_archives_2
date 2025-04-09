import axios from "axios";
import { promises } from "fs";
import path, { dirname } from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
const fs = { promises }.promises;
const OUTPUT_DIR = "img/thumbnails/";
const SIZES = {
  default: 75,
  large: 250,
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_FORMAT = "jpg";
const fetchExternalImage = async (url) => {
  const { data } = await axios({ url, responseType: "arraybuffer" });
  return data;
};
const writeThumbnailsFromUrl = async ({ url, filename, basedir }) => {
  const data = await fetchExternalImage(url);
  return writeThumbnails({ data, filename, basedir });
};
const writeThumbnailsFromPath = async ({ path, filename, basedir }) => {
  const data = await fs.readFile(path);
  return writeThumbnails({ data, filename, basedir });
};
const writeThumbnails = async ({ data, filename, basedir }) => {
  const buffer = Buffer.from(data, "base64");
  const image = sharp(buffer);
  return Promise.all(Object.keys(SIZES).map(async (size) => writeThumbnail({ image, filename, size, basedir })));
};
const writeThumbnail = async ({ image, filename, size, basedir }) => {
  const output_name = `${filename}${size === "default" ? "" : `-${size}`}.${OUTPUT_FORMAT}`;
  const base_path = path.resolve(__dirname, path.join("../../", basedir));
  const output_path = path.join(base_path, OUTPUT_DIR, output_name);
  await image.resize({ width: SIZES[size] }).withMetadata().toFile(output_path);
  return output_path;
};
export { writeThumbnailsFromPath, writeThumbnailsFromUrl };
export default {
  writeThumbnailsFromPath,
  writeThumbnailsFromUrl,
};
