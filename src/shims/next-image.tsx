/**
 * `next/image` for the Astro build. The site runs `images.unoptimized`, so this
 * renders the same `<img>` Next emitted: lazy by default, `priority` eager with
 * high fetch priority, `fill` absolutely positioned.
 */
import type { CSSProperties, ImgHTMLAttributes } from "react";

type StaticImport = { src: string; width?: number; height?: number };

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string | StaticImport;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
  overrideSrc?: string;
};

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blur,
  unoptimized: _unoptimized,
  loader: _loader,
  overrideSrc,
  loading,
  decoding,
  style,
  sizes,
  ...rest
}: ImageProps) {
  const resolved = typeof src === "string" ? src : src.src;
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0 }
    : undefined;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      loading={priority ? undefined : (loading ?? "lazy")}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      decoding={decoding ?? "async"}
      data-nimg={fill ? "fill" : "1"}
      {...rest}
      style={{ ...fillStyle, color: "transparent", ...style }}
      sizes={sizes}
      src={overrideSrc ?? resolved}
    />
  );
}
