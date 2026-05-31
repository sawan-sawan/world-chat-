import React from "react";
import favicon from "../favicon.png";

export default function LogoIcon({ size = 28 }) {
  return (
    <img
      className="logo-image"
      src={favicon}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  );
}
