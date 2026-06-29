export const IMMUTABLE_DATA_CACHE_CONTROL =
  "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

// Typeahead/search answers should reflect current resolver behaviour immediately;
// stale cache can hide newly added shaped variants in the dropdown.
const SEARCH_CACHE_CONTROL = "no-store";

export const immutableDataHeaders = {
  "Cache-Control": IMMUTABLE_DATA_CACHE_CONTROL,
};

export const searchCacheHeaders = {
  "Cache-Control": SEARCH_CACHE_CONTROL,
};
