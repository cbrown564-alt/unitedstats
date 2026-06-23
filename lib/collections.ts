import { collectionRef } from "./citations";
import { MAX_COLLECTION_CHARS, MAX_COLLECTION_CUTS, encodeCollectionHrefs } from "./collectionShare";
import { cutFromParams, cutHref, runCut, type Cut, type CutResult } from "./cut";

export { MAX_COLLECTION_CHARS, MAX_COLLECTION_CUTS };

interface CollectionPayload {
  v: 1;
  cuts: string[];
}

interface SavedCollection {
  encoded: string;
  ref: ReturnType<typeof collectionRef>;
  cuts: { href: string; cut: Cut; result: CutResult }[];
}

export type CollectionDecodeResult =
  | { ok: true; collection: SavedCollection }
  | { ok: false; error: string };

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function encodeCollection(cuts: Cut[]): string {
  if (cuts.length === 0) throw new Error("collection requires at least one Cut");
  if (cuts.length > MAX_COLLECTION_CUTS) throw new Error(`collection exceeds ${MAX_COLLECTION_CUTS} Cuts`);
  const encoded = encodeCollectionHrefs(cuts.map((cut) => cutHref(cut)));
  if (encoded.length > MAX_COLLECTION_CHARS) throw new Error(`collection exceeds ${MAX_COLLECTION_CHARS} URL characters`);
  return encoded;
}

export function decodeCollection(encoded: string): CollectionDecodeResult {
  if (!encoded) return { ok: false, error: "Missing collection payload." };
  if (encoded.length > MAX_COLLECTION_CHARS) {
    return { ok: false, error: `Collection exceeds ${MAX_COLLECTION_CHARS} URL characters.` };
  }
  try {
    const payload = JSON.parse(decodeBase64Url(encoded)) as CollectionPayload;
    if (payload.v !== 1 || !Array.isArray(payload.cuts)) return { ok: false, error: "Unsupported collection payload." };
    if (payload.cuts.length === 0) return { ok: false, error: "Collection has no Cuts." };
    if (payload.cuts.length > MAX_COLLECTION_CUTS) return { ok: false, error: `Collection exceeds ${MAX_COLLECTION_CUTS} Cuts.` };
    const cuts = payload.cuts.map((href) => {
      const url = new URL(href, "https://unitedstats.local");
      if (url.pathname !== "/cut") throw new Error(`Unsupported collection item: ${href}`);
      const cut = cutFromParams(Object.fromEntries(url.searchParams.entries()));
      return { href: cutHref(cut), cut, result: runCut(cut, 12) };
    });
    return { ok: true, collection: { encoded, ref: collectionRef(encoded), cuts } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid collection payload." };
  }
}
