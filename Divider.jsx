import React from "react";

export function Divider({ className = "" }) {
  return <hr className={`dashed-amber ${className}`} />;
}

export default Divider;