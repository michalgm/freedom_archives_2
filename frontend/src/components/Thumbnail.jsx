import { BrokenImage, HeadphonesTwoTone, LanguageTwoTone, OndemandVideo, PictureAsPdf } from "@mui/icons-material";
import { Avatar, Box } from "@mui/material";
import { useCallback, useState } from "react";

const no_digital_image = "/static/images/nodigital.png";

const MEDIA_TYPE_ICONS = {
  Audio: HeadphonesTwoTone,
  Webpage: LanguageTwoTone,
};

const MEDIA_TYPE_BADGES = {
  PDF: PictureAsPdf,
  Video: OndemandVideo,
};

export default function Thumbnail({ item, src: _src, width = 75, alt = "", type: _type }) {
  const [brokenLink, setBrokenLink] = useState(false);
  const type = item?.record_id != null ? "record" : "collection";
  let src = "";
  const media_type = item?.primary_instance_media_type || item.media_type;

  let Icon = brokenLink ? BrokenImage : MEDIA_TYPE_ICONS[media_type];

  if (!Icon) {
    const cache_buster = item?.date_modified ? `?${item.date_modified}` : "";
    if (!_src) {
      if (type === "collection") {
        if (item?.thumbnail) {
          src = `/${item?.thumbnail}${cache_buster}`;
        } else {
          Icon = BrokenImage;
        }
      } else {
        src = media_type ? `/images/thumbnails/records/${item?.record_id}.jpg${cache_buster}` : "";
      }
    } else {
      src = _src;
    }
  }

  const onError = useCallback((_e) => {
    setBrokenLink(true);
  }, []);

  if (Icon) {
    const bgcolor = Icon === BrokenImage ? undefined : "primary.main";
    return (
      <Avatar
        style={{ width, height: width, border: "1px solid rgba(0, 0, 0, 0.1)" }}
        sx={{ bgcolor }}
        variant="rounded"
      >
        <Icon style={{ fontSize: width * 0.8 }} />
      </Avatar>
    );
  }
  const Badge = MEDIA_TYPE_BADGES[media_type];

  return (
    <span style={{ width, minWidth: width, display: "inline-flex", position: "relative" }}>
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
          border: "1px solid rgba(0, 0, 0, 0.1)",
          width: "100%",
        }}
        src={src || no_digital_image}
        onError={onError}
        alt={alt}
      />
    </span>
  );
}
