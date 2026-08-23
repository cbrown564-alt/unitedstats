const IMMUTABLE_DATA_CACHE_CONTROL =
  "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

export const immutableDataHeaders = {
  "Cache-Control": IMMUTABLE_DATA_CACHE_CONTROL,
};
