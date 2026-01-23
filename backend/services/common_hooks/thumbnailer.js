import { BadRequest } from "@feathersjs/errors";
import axios from "axios";
import { promises } from "fs";
import path, { dirname } from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const fs = { promises }.promises;
const OUTPUT_DIR = "img/thumbnails/";
export const SIZES = {
  default: 100,
  small: 75,
  large: 250,
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_FORMAT = "jpg";

const MEDIA_TYPES = {
  'mp3': 'Audio',
  'mp4': 'Video',
  'wav': 'Audio',
  'jpg': 'Image',
  'png': 'Image',
  'jpeg': 'Image',
  'tiff': 'Image',
  'bmp': 'Image',
  'pdf': 'PDF',
};

const thumbnailApis = {
  'vimeo.com': async (url) => {
    const { data } = await axios.get(`https://vimeo.com/api/oembed.json?url=${url}`, { headers: { 'Referer': 'http://freedomarchives.org/' } });
    if (data.thumbnail_url) {
      return data.thumbnail_url;
    }
    throw new Error(`Bad vimeo url: ${url}`);
  },
  '(?:(?!www.))archive.org': (url) => {
    const id = url.split('/').pop();
    return (`https://archive.org/services/img/${id}`);
  },
  'youtube.com': (url) => {
    const id = url.split('=').pop();
    return (`https://i.ytimg.com/vi/${id}/mqdefault.jpg`);
  },
};

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
  let data;
  if (url.startsWith('data:')) {
    data = processDataUrl(url);
  } else {
    if (!url.match(/^https?:\/\//)) {
      url = `https://search.freedomarchives.org/${url}`;
    }
    try {
      data = await fetchExternalImage(url);
    } catch (error) {
      throw new BadRequest(`Error fetching media url "${url}": ${error}`);
    }
  }
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
  const output_name = `${filename}${size === "default" ? "" : `_${size}`}.${OUTPUT_FORMAT}`;
  const base_path = path.resolve(__dirname, path.join("../../", basedir));
  const output_path = path.join(base_path, OUTPUT_DIR, output_name);
  await fs.mkdir(path.dirname(output_path), { recursive: true });
  await image.resize({ width: SIZES[size] }).withMetadata().toFile(output_path);
  return output_path.replace(`${base_path}/`, '').replace('img/', 'images/');
};

const updateThumbnail = async (context) => {
  const { relation_data, method, service: { fullName }, params: {
    user,
    transaction: { trx },
  } } = context;

  const type = fullName.replace('api/', '');
  let url = '';
  if (type === 'records') {
    url = relation_data?.media?.[0]?.url;
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
    // console.log(args);

    const params = { user, transaction: { trx } };
    if (type === 'collections') {
      const paths = await writeThumbnailsFromUrl(args);
      for (const path of paths) {
        if (path.endsWith(`${filename}.jpg`)) {
          await context.service._patch(id, { thumbnail: path }, params);
        }
      }
    }
    if (type === 'records') {
      let media_type = '';
      for (const [key, value] of Object.entries(thumbnailApis)) {
        if (url.match(key)) {
          args.url = await value(url);
          media_type = 'Video';
          break;
        }
      }
      if (!media_type) {
        const ext = url.split('.').pop().replace(/\?.*/g, '').toLowerCase();
        media_type = MEDIA_TYPES[ext] || 'Webpage';
        // if (!MEDIA_TYPES[ext]) {
        //   console.log(`  - Inferred media type for ${url} as ${media_type} from file extension .${ext}`);
        // }
      }
      if (['Video', 'Image', 'PDF'].includes(media_type)) {
        await writeThumbnailsFromUrl(args);
      }

      if (method === 'create') {
        relation_data.media[0].media_type = media_type;
      } else {
        await context.app.service('api/media')._patch(relation_data.media[0].media_id, { media_type }, params);
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
  updateThumbnail,
};
