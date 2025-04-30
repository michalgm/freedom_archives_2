import { BrokenImage } from "@mui/icons-material";
import { Avatar } from "@mui/material";
import { useCallback, useState } from "react";

const no_digital_image = "/static/images/nodigital.png";

export default function Thumbnail({ item, width = 75, alt = "" }) {
  const [brokenLink, setBrokenLink] = useState(false);
  const type = item?.record_id ? "record" : "collection";
  let src = "";
  if (type === "collection") {
    src = `https://search.freedomarchives.org/${item?.thumbnail}`;
  } else {
    src = item.primary_instance_thumbnail ? `/images/thumbnails/${item?.record_id}.jpg` : "";
  }
  const flex = `0 0 ${width}px`;

  const onError = useCallback(() => {
    setBrokenLink(true);
  }, []);

  if (brokenLink) {
    return (
      <Avatar style={{ width, height: width, flex }}>
        <BrokenImage style={{ fontSize: width * 0.7 }} />
      </Avatar>
    );
  }

  if (!item.record_id && !item.collection_id) return null;

  return (
    <span style={{ width, minWidth: width, display: "flex", flex, alignItems: "start" }}>
      <img
        style={{
          maxWidth: "100%",
        }}
        src={src || no_digital_image}
        onError={onError}
        alt={alt}
      />
    </span>
  );
}
