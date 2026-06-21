export const IMMUTABLE_DATA_CACHE_CONTROL =
  "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

const SEARCH_CACHE_CONTROL =
  "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800";

export const immutableDataHeaders = {
  "Cache-Control": IMMUTABLE_DATA_CACHE_CONTROL,
};

export const searchCacheHeaders = {
  "Cache-Control": SEARCH_CACHE_CONTROL,
};
