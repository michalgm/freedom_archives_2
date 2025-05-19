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

const processDataUrl = (dataUrl) => {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL');
  }

  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid data URL format');
  }

  return matches[2];
};

const writeThumbnailsFromUrl = async ({ url, filename, basedir }) => {
  const data = await fetchExternalImage(url);
  return writeThumbnails({ data, filename, basedir });
};

const writeThumbnailsFromPath = async ({ path, filename, basedir }) => {
  const data = await fs.readFile(path);
  return writeThumbnails({ data, filename, basedir });
};
// New function to handle data URLs
const writeThumbnailsFromDataUrl = async ({ url, filename, basedir }) => {
  const data = processDataUrl(url);
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
  await fs.mkdir(path.dirname(output_path), { recursive: true });
  await image.resize({ width: SIZES[size] }).withMetadata().toFile(output_path);
  return output_path.replace(`${base_path}/`, '').replace('img/', 'images/');
};

const updateThumbnail = async (context) => {
  const { relation_data, service: { fullName }, params: {
    user,
    transaction: { trx },
  } } = context;
  const type = fullName.replace('api/', '');
  let url = '';
  if (type === 'records') {
    url = relation_data?.instances?.[0]?.url;
  } else if (type === 'collections') {
    url = relation_data?.thumbnail;
  }
  if (url) {
    const id_field = `${type.replace('s', '')}_id`;
    const id = context.result[id_field];
    const filename = `${type}/${id}`;
    const basedir = context.app.get("public");
    const args = {
      url,
      filename,
      basedir,
    };
    const paths = await (type === 'records' ? writeThumbnailsFromUrl : writeThumbnailsFromDataUrl)(args);
    const params = { user, transaction: { trx } };

    for (const path of paths) {
      if (path.endsWith(`${filename}.jpg`) && type === 'collections') {
        await context.service._patch(id, { thumbnail: path }, params);
      }
    }
  }
  return context;
};

export {
  writeThumbnailsFromPath,
  writeThumbnailsFromUrl,
  writeThumbnails,
  writeThumbnailsFromDataUrl,
  updateThumbnail
};
