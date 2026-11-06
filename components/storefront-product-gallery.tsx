"use client";

import { useState } from "react";

export function StorefrontProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] ?? images[0];

  return <div>
    <div
      role="img"
      aria-label={`${productName}, image ${selectedIndex + 1} of ${images.length}`}
      className="relative min-h-[520px] bg-[#e6dfd5] bg-cover bg-center sm:min-h-[680px] lg:min-h-[720px]"
      style={{ backgroundImage: `url('${selectedImage}')` }}
    >
      <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-black/55 backdrop-blur">
        {selectedIndex + 1} / {images.length}
      </span>
    </div>
    {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
      {images.map((image, index) => <button
        key={image}
        type="button"
        aria-label={`Show ${productName} image ${index + 1}`}
        aria-pressed={selectedIndex === index}
        onClick={() => setSelectedIndex(index)}
        className={`aspect-[.78] overflow-hidden border-2 bg-[#e6dfd5] bg-cover bg-center transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/15 ${selectedIndex === index ? "border-[var(--store-accent)] opacity-100" : "border-transparent opacity-60"}`}
        style={{ backgroundImage: `url('${image}')` }}
      />)}
    </div>}
  </div>;
}
