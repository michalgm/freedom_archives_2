import { BrokenImage } from "@mui/icons-material";
import { Avatar } from "@mui/material";
import React from "react";

const onError = (event) => {
  event.target.src = `/static/images/nodigital.png`;
};

export default function Thumbnail({ src, width = 75, alt = "" }) {
  const flex = `0 0 ${width}px`;
  if (src) {
    return (
      <span style={{ width, minWidth: width, display: "flex", flex }}>
        <img
          style={{
            maxWidth: "100%",
          }}
          src={src}
          onError={onError}
          alt={alt}
        />
      </span>
    );
  } else {
    return (
      <Avatar style={{ width, height: width, flex }}>
        <BrokenImage style={{ fontSize: width * 0.6 }} />
      </Avatar>
    );
  }
}
