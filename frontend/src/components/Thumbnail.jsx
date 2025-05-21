import { BrokenImage } from "@mui/icons-material";
import { Avatar } from "@mui/material";
import { useCallback, useState } from "react";

const no_digital_image = "/static/images/nodigital.png";

export default function Thumbnail({ item, src: _src, width = 75, alt = "", type: _type }) {
  const [brokenLink, setBrokenLink] = useState(false);
  const type = _type || item?.record_id ? "record" : "collection";
  let src = "";

  const cache_buster = item.date_modified ? `?${item.date_modified}` : "";
  if (!_src) {
    if (type === "collection") {
      src = `/${item?.thumbnail}${cache_buster}`;
    } else {
      src = item.primary_instance_thumbnail ? `/images/thumbnails/records/${item?.record_id}.jpg${cache_buster}` : "";
    }
  } else {
    src = _src;
  }

  const onError = useCallback((_e) => {
    setBrokenLink(true);
  }, []);

  if (brokenLink) {
    return (
      <Avatar style={{ width, height: width, border: "1px solid rgba(0, 0, 0, 0.1)" }}>
        <BrokenImage style={{ fontSize: width * 0.7 }} />
      </Avatar>
    );
  }

  return (
    <span style={{ width, minWidth: width, display: "inline-block" }}>
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
