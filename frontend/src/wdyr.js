import React from "react";

if (import.meta.env.MODE === "development") {
  // eslint-disable-next-line no-undef
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}
