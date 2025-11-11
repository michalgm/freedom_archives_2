import { BrokenImage, HeadphonesTwoTone, LanguageTwoTone, OndemandVideo, PictureAsPdf } from "@mui/icons-material";
import { Avatar, Box } from "@mui/material";
import { useCallback, useState } from "react";

const no_digital_image = "/static/images/nodigital.png";
const SIZES = {
  default: 100,
  small: 75,
  large: 250,
};

const MEDIA_TYPE_ICONS = {
  Audio: HeadphonesTwoTone,
  Webpage: LanguageTwoTone,
};

const MEDIA_TYPE_BADGES = {
  PDF: PictureAsPdf,
  Video: OndemandVideo,
};

export default function Thumbnail({ item, src: _src, width = 75, alt = "", type: _type, sx = {}, ...props }) {
  const [brokenLink, setBrokenLink] = useState(false);
  const onError = useCallback((_e) => {
    setBrokenLink(true);
  }, []);
  const type = _type || (item?.record_id != null ? "record" : "collection");
  let src = "";
  const media_type = item?.primary_media_media_type || item.media_type;

  let Icon = brokenLink ? BrokenImage : MEDIA_TYPE_ICONS[media_type];

  const size = width >= SIZES.default * 1.2 ? "_large" : ""; //width <= SIZES.default * 0.8 ? "_small" : "";
  if (!Icon) {
    const cache_buster = item?.date_modified ? `?${item?.date_modified}` : "";
    if (!_src) {
      if (type === "collection") {
        if (item?.thumbnail) {
          // src = `/${item?.thumbnail}${cache_buster}`;
          src = `/images/thumbnails/collections/${item?.collection_id}${size}.jpg${cache_buster}`;
        } else {
          Icon = BrokenImage;
        }
      } else {
        src = media_type ? `/images/thumbnails/records/${item?.record_id}${size}.jpg${cache_buster}` : "";
        // src = media_type ? `/images/thumbnails/records/${39180}${size}.jpg${cache_buster}` : "";
      }
    } else {
      src = _src;
    }
  }

  if (Icon) {
    const bgcolor = Icon === BrokenImage ? undefined : "primary.main";
    return (
      <Avatar
        style={{ width, height: width, border: "1px solid rgba(0, 0, 0, 0.1)" }}
        sx={{ bgcolor, ...sx }}
        variant="rounded"
        {...props}
      >
        <Icon style={{ fontSize: width * 0.8 }} />
      </Avatar>
    );
  }
  const Badge = MEDIA_TYPE_BADGES[media_type];

  return (
    <Box sx={{ width, minWidth: width, display: "inline-flex", position: "relative", ...sx }} {...props}>
      {Badge && (
        <Box
          sx={{
            display: "flex",
            position: "absolute",
            bottom: "2px",
            right: "2px",
            backgroundColor: "primary.main",
            opacity: 0.8,
          }}
        >
          <Badge sx={{ color: "white", width: width / 2, height: width / 2 }} />
        </Box>
      )}
      <img
        style={{
          objectFit: "contain",
          // border: "1px solid rgba(0, 0, 0, 0.1)",
          width: "100%",
        }}
        src={src || no_digital_image}
        onError={onError}
        alt={alt}
      />
    </Box>
  );
}
