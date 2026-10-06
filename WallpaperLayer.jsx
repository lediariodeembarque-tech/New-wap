import React from "react";

export function WallpaperLayer({ url }) {
  if (!url) return null;
  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }}>
      <div className="absolute inset-0 bg-[#0A1220]/55" />
    </div>
  );
}

export default WallpaperLayer;