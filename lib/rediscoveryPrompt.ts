/** Client-safe rediscovery prompt shape — no SQLite imports. */
export interface RediscoveryPrompt {
  id: string;
  href: string;
  prompt: string;
  line: string;
  year: string;
  score: string;
  scoreSuffix: string;
  opponent: string;
  tone: string;
  meta: string;
  /** Preformatted for rails — "17 Mar 2016 · Europa League". */
  dateLine: string;
  total: number;
}

export function promptDateLine(p: RediscoveryPrompt): string {
  return p.dateLine;
}
