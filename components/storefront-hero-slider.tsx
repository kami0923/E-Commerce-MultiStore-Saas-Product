"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function StorefrontHeroSlider({ images, name, accent }: { images: readonly string[]; name: string; accent: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive(current => (current + 1) % images.length), 4800);
    return () => window.clearInterval(timer);
  }, [images.length]);
  const go = (direction: number) => setActive(current => (current + direction + images.length) % images.length);

  return <div className="group relative min-h-[480px] overflow-hidden bg-[#d8d0c4] lg:min-h-[680px]">
    {images.map((image, index) => <div key={image} aria-hidden={index !== active} className={`absolute inset-0 bg-cover bg-center transition duration-1000 ease-out ${index === active ? "scale-100 opacity-100" : "scale-[1.035] opacity-0"}`} style={{ backgroundImage: `linear-gradient(90deg,rgba(10,20,15,.04),rgba(10,20,15,.12)),url('${image}')` }} />)}
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-5 pt-24 text-white sm:p-7">
      <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/65">Featured story</p><p className="mt-2 font-serif text-2xl">{name}</p></div>
      <div className="flex items-center gap-3"><span className="text-xs font-black tabular-nums">{String(active + 1).padStart(2, "0")} <span className="text-white/40">/ {String(images.length).padStart(2, "0")}</span></span><button type="button" aria-label="Previous image" onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full border border-white/30 bg-black/15 backdrop-blur transition hover:bg-white hover:text-black"><ArrowLeft className="size-4" /></button><button type="button" aria-label="Next image" onClick={() => go(1)} className="grid size-10 place-items-center rounded-full text-[#10231a] transition hover:scale-105" style={{ backgroundColor: accent }}><ArrowRight className="size-4" /></button></div>
    </div>
    <div className="absolute left-5 top-5 flex gap-1.5">{images.map((_, index) => <button key={index} type="button" aria-label={`Show image ${index + 1}`} onClick={() => setActive(index)} className={`h-1 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-3 bg-white/45"}`} />)}</div>
  </div>;
}
