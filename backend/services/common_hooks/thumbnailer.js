const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

const OUTPUT_DIR = "img/thumbnails/";
const SIZES = {
  default: 75,
  large: 250,
};
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

module.exports = {
  writeThumbnailsFromPath,
  writeThumbnailsFromUrl,
};

// function updateThumbnail($doc_id, $check = 0) {
//   global $production;
//   $doc_id = dbEscape($doc_id);
//   $doc = fetchRow("select * from DOCUMENTS where docid = $doc_id", true);
//   if ($doc['THUMBNAIL'] != '' && $check) {
//     return;
//   }
//   $tmpfile = "tmp/$doc_id";
//   $status = 'Failed';
//   $image_file = "";
//   if ($doc['URL']) {
//     $url = $doc['URL'];
//     $filetype = checkFileType($url);

//     if ($production) {
//       $url = urldecode(preg_replace("|^http:\/\/[^\.]*\.?freedomarchives.org\/|", '/home/claude/public_html/', $url));
//     }
//     if (file_exists($url) || url_exists($url)) {
//       if ($filetype['media_type'] == 'Webpage') {
//         $image_file = "images/fileicons/webpage.png";
//         $status = 'Success';
//       } else if ($filetype['media_type'] == 'Audio') {
//         $image_file = "images/fileicons/audio.png";
//         $status = 'Success';
//       } else if ($filetype['media_type'] != '') {
//         $icon = "";
//         $filename = "";
//         if ($filetype['media_type'] == 'PDF') {
//           $icon = "../images/fileicons/pdf.png";
//         } else if ($filetype['media_type'] == 'Video') {
//           $vimeo_id = preg_replace("/^.*?\/(\d+)$/", "$1", $url);
//           $json_url = "http://vimeo.com/api/v2/video/$vimeo_id.json";
//           if (url_exists($json_url)) {
//             $icon = "../images/fileicons/video.png";
//             $json = json_decode(file_get_contents($json_url), 1);
//             $url = $json[0]['thumbnail_large'];
//           }
//         }
//         if (file_exists($url)) {
//           $filename = $url;
//         } else if (url_exists($url)) {
//           copy($url, $tmpfile);
//           $filename = $tmpfile;
//         }
//         if (file_exists($filename)) {
//           $image_file = createThumbnail($filename, $icon, $doc_id);
//           if ($image_file == 'timeout') {
//             $status = 'Thumbnail creation timed out. Bad Document?';
//           } else if (file_exists("$image_file")) {
//             $status = 'Success';
//           } else {
//             $status = "Failed: $filename";
//           }
//           if (file_exists($tmpfile)) { unlink($tmpfile); }
//         } else { $status = "bad url for doc #$doc_id: $url"; }
//       } else {
//         $status = "Unknown file format '$filetype[ext]' for doc id $doc_id";
//       }
//     } else { $status = "bad url for doc #$doc_id: $url"; }
//     $image_file = preg_replace("|^../|", "", $image_file);
//     dbwrite("update DOCUMENTS set thumbnail= '$image_file' where docid = $doc_id");
//   } else {
//     $status = 'Missing URL';
//   }
//   return array('status'=> $status, 'image'=> $image_file);
// }

// function createThumbnail($image, $icon, $output_name) {
//   global $production;
//   $thumbnail_path = "images/thumbnails/";

//   $large_size = 250;
//   $small_size = 75;
//   $border = "";
//   $timeout = 10;
//   $convert_path = $production ? "/usr/local/bin/convert" : "convert";

//   if ($image && file_exists($image)) {
//     #$orig_image = $image;
//     #$image = str_replace("[0]", "", $image);
//     #if(!preg_match("/\....$/", $image)) {
// 		#	$image.= ".jpg";
// 		#
//     }
//     //if(stripos($image, 'tmp')) {
//     $border = " -bordercolor '#333' -border 1 ";
//     $large_size -= 2;
//     $small_size -= 2;
//     //}

//     $large_file = "$thumbnail_path/$output_name"."_large.jpg";
//     $small_file = "$thumbnail_path/$output_name.jpg";
//     if (file_exists("../$large_file")) { unlink("../$large_file"); }
//     if (file_exists("../$small_file")) { unlink("../$small_file"); }

//     $image = escapeshellarg($image);
//     $icon_image = $icon ? "-background transparent $icon -gravity SouthEast -geometry 70x+15+15 -composite " : "";
//     $small_icon_image = $icon ? "-background transparent $icon -gravity SouthEast -geometry 23x+5+5 -composite " : "";
//     $large_cmd = "$convert_path $image"."[0] -trim +repage -background \"#fff\" -flatten -thumbnail '$large_size"."x$large_size>' -background \"#fff\" -gravity center -extent $large_size"."x$large_size $icon_image $border ../$large_file 2>&1";
//     $small_cmd = "$convert_path $image"."[0] -trim +repage -background \"#fff\" -flatten -thumbnail '$small_size"."x' -background \"#fff\" -gravity center -extent $small_size"."x $small_icon_image $border ../$small_file 2>&1";
//     /*
//     exec($large_cmd, $output1);
//     print_r($output1);
//     exec($small_cmd, $output2);
//     print_r($output2);
//     if ($output1 || $output2) {
//       exit;
//     }*/

//     $one = ExecWaitTimeout($large_cmd);
//     $two = ExecWaitTimeout($small_cmd);
//     if (!$one || !$two) {
//       return "timeout";
//     }

//     if (!file_exists("../$large_file") || !file_exists("../$small_file")) {
//       return;
//     }

//     return "../$small_file";
//   }
// }
