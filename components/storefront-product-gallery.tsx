"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function StorefrontProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length < 2) return;
    const timer = window.setInterval(() => setSelectedIndex(current => (current + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  const showPrevious = () => setSelectedIndex(current => (current - 1 + images.length) % images.length);
  const showNext = () => setSelectedIndex(current => (current + 1) % images.length);

  return <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
    <div
      role="group"
      aria-label={`${productName} image gallery`}
      className="storefront-product-gallery relative min-h-[520px] overflow-hidden bg-[#e6dfd5] sm:min-h-[680px] lg:min-h-[720px]"
    >
      {images.map((image, index) => <div
        key={image}
        role="img"
        aria-label={`${productName}, image ${index + 1} of ${images.length}`}
        aria-hidden={selectedIndex !== index}
        className={`absolute inset-0 bg-cover bg-center transition duration-700 ease-out ${selectedIndex === index ? "scale-100 opacity-100" : "scale-[1.025] opacity-0"}`}
        style={{ backgroundImage: `url('${image}')` }}
      />)}
      {images.length > 1 && <div className="absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 justify-between">
        <button type="button" onClick={showPrevious} aria-label="Previous product image" className="grid size-11 place-items-center rounded-full bg-white/90 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"><ArrowLeft className="size-4" /></button>
        <button type="button" onClick={showNext} aria-label="Next product image" className="grid size-11 place-items-center rounded-full bg-white/90 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"><ArrowRight className="size-4" /></button>
      </div>}
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
