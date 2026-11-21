"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MoveHorizontal } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type RailProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  productType: string | null;
  media: { mediaAsset: { url: string } }[];
  variants: { priceMinor: number }[];
};

export function ProductDepthRail({
  products,
  storeSlug,
  currency,
  fallbackImages,
}: {
  products: RailProduct[];
  storeSlug: string;
  currency: string;
  fallbackImages: readonly string[];
}) {
  const [active, setActive] = useState(0);
  const visibleProducts = useMemo(() => products.slice(0, 8), [products]);

  if (!visibleProducts.length) return null;

  const move = (direction: number) => {
    setActive(current => (current + direction + visibleProducts.length) % visibleProducts.length);
  };

  return (
    <section className="product-depth-rail" aria-label="Featured product rail">
      <div className="product-depth-rail-heading">
        <div>
          <p>Move through the collection</p>
          <h2>Objects in motion.</h2>
        </div>
        <div className="product-depth-rail-controls">
          <span><MoveHorizontal aria-hidden="true" /> Swipe or use arrows</span>
          <button type="button" onClick={() => move(-1)} aria-label="Previous product"><ArrowLeft /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next product"><ArrowRight /></button>
        </div>
      </div>

      <div
        className="product-depth-stage"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
      >
        {visibleProducts.map((product, index) => {
          let offset = index - active;
          const halfway = visibleProducts.length / 2;
          if (offset > halfway) offset -= visibleProducts.length;
          if (offset < -halfway) offset += visibleProducts.length;
          const distance = Math.abs(offset);
          const image = product.media[0]?.mediaAsset.url ?? fallbackImages[(index % Math.max(fallbackImages.length - 1, 1)) + 1] ?? fallbackImages[0];
          const price = product.variants[0]?.priceMinor;
          const style = {
            "--rail-offset": offset,
            "--rail-distance": distance,
            zIndex: 20 - distance,
          } as CSSProperties;

          return (
            <Link
              key={product.id}
              href={`/store/${storeSlug}/product/${product.slug}` as never}
              className="product-depth-card"
              data-active={distance === 0 ? "true" : "false"}
              style={style}
              onClick={event => {
                if (distance !== 0) {
                  event.preventDefault();
                  setActive(index);
                }
              }}
            >
              <span className="product-depth-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="product-depth-image" style={{ backgroundImage: `url('${image}')` }} />
              <span className="product-depth-copy">
                <small>{product.brand || product.productType || "Featured piece"}</small>
                <strong>{product.name}</strong>
                {typeof price === "number" && <b>{formatMoney(price, currency)}</b>}
              </span>
              <span className="product-depth-open"><ArrowRight /></span>
            </Link>
          );
        })}
      </div>
      <div className="product-depth-progress" aria-hidden="true">
        {visibleProducts.map((product, index) => <button key={product.id} type="button" className={index === active ? "is-active" : ""} onClick={() => setActive(index)} />)}
      </div>
    </section>
  );
}
