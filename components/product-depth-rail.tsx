"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MoveHorizontal, MousePointer2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type RailProduct = { id: string; name: string; slug: string; brand: string | null; productType: string | null; media: { mediaAsset: { url: string } }[]; variants: { priceMinor: number }[] };
type Look = RailProduct & { lookId: string; image: string; lookNumber: number };

export function ProductDepthRail({ products, storeSlug, currency, fallbackImages }: { products: RailProduct[]; storeSlug: string; currency: string; fallbackImages: readonly string[] }) {
  const railRef = useRef<HTMLElement>(null);
  const dragStart = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const looks = useMemo(() => {
    const uploaded = products.flatMap(product => product.media.map((media, mediaIndex) => ({ ...product, lookId: `${product.id}-${mediaIndex}`, image: media.mediaAsset.url, lookNumber: mediaIndex + 1 })));
    const result: Look[] = uploaded.length ? uploaded.slice(0, 8) : products.map((product, index) => ({ ...product, lookId: `${product.id}-fallback`, image: fallbackImages[index % fallbackImages.length], lookNumber: 1 }));
    const target = Math.min(8, Math.max(4, products.length * 2));
    for (let index = result.length; index < target && products.length; index += 1) {
      const product = products[index % products.length];
      result.push({ ...product, lookId: `${product.id}-editorial-${index}`, image: fallbackImages[(index + 1) % fallbackImages.length], lookNumber: index + 1 });
    }
    return result;
  }, [fallbackImages, products]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || looks.length < 2) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = rail.getBoundingClientRect();
      const distance = Math.max(1, rail.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      rail.style.setProperty("--rail-progress", progress.toFixed(4));
      const next = Math.round(progress * (looks.length - 1));
      setActive(current => current === next ? current : next);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, [looks.length]);

  if (!looks.length) return null;
  const jumpTo = (index: number) => {
    const next = (index + looks.length) % looks.length;
    setActive(next);
    const rail = railRef.current;
    if (!rail || looks.length < 2) return;
    const distance = Math.max(0, rail.offsetHeight - window.innerHeight);
    window.scrollTo({ top: rail.offsetTop + (next / (looks.length - 1)) * distance, behavior: "smooth" });
  };
  const railStyle = { "--rail-steps": Math.max(1, looks.length - 1) } as CSSProperties;

  return <section ref={railRef} style={railStyle} className="product-depth-rail" aria-label="Scroll-controlled product lookbook">
    <div className="product-depth-sticky">
      <div className="product-depth-orbit" aria-hidden="true"><span>{String(active + 1).padStart(2, "0")}</span></div>
      <div className="product-depth-rail-heading"><div><p>Interactive collection</p><h2>Looks in motion.</h2></div><div className="product-depth-rail-controls"><span><MoveHorizontal aria-hidden="true" /> Scroll, drag or use arrows</span><button type="button" onClick={() => jumpTo(active - 1)} aria-label="Previous look"><ArrowLeft /></button><button type="button" onClick={() => jumpTo(active + 1)} aria-label="Next look"><ArrowRight /></button></div></div>
      <div className="product-depth-stage" tabIndex={0} onKeyDown={event => { if (event.key === "ArrowLeft") jumpTo(active - 1); if (event.key === "ArrowRight") jumpTo(active + 1); }} onPointerDown={event => { dragStart.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={event => { if (dragStart.current === null) return; const delta = event.clientX - dragStart.current; dragStart.current = null; if (Math.abs(delta) > 35) jumpTo(active + (delta < 0 ? 1 : -1)); }}>
        <div className="product-depth-drag-cue" aria-hidden="true"><MousePointer2 /> Drag the look</div>
        {looks.map((look, index) => {
          const offset = index - active;
          const distance = Math.abs(offset);
          const price = look.variants[0]?.priceMinor;
          const style = { "--rail-offset": offset, "--rail-distance": distance, zIndex: 30 - Math.min(distance, 20) } as CSSProperties;
          return <Link key={look.lookId} href={`/store/${storeSlug}/product/${look.slug}` as never} className="product-depth-card" data-active={distance === 0 ? "true" : "false"} data-past={offset < 0 ? "true" : "false"} style={style} onClick={event => { if (distance !== 0) { event.preventDefault(); jumpTo(index); } }}><span className="product-depth-index">LOOK {String(index + 1).padStart(2, "0")}</span><span className="product-depth-image" style={{ backgroundImage: `url('${look.image}')` }} /><span className="product-depth-copy"><small>{look.brand || look.productType || `Editorial look ${look.lookNumber}`}</small><strong>{look.name}</strong>{typeof price === "number" && <b>{formatMoney(price, currency)}</b>}</span><span className="product-depth-open"><ArrowRight /></span></Link>;
        })}
      </div>
      <div className="product-depth-progress" aria-label="Choose a look">{looks.map((look, index) => <button key={look.lookId} type="button" aria-label={`Show look ${index + 1}`} className={index === active ? "is-active" : ""} onClick={() => jumpTo(index)}><span /></button>)}</div>
      <p className="product-depth-scroll-note">Keep scrolling to move through the rail</p>
    </div>
  </section>;
}
