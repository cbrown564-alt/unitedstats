/**
 * Click-through telemetry is a no-op on the static export — there is no
 * request-shaped beacon endpoint. Kept so typeahead clicks stay call-site identical.
 */
export function logSearchClick(
  _q: string,
  _href: string,
  _resultCount: number,
): void {
  void _q;
  void _href;
  void _resultCount;
}
