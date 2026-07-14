/** Client-safe rediscovery prompt shape — keep free of server/db imports. */
export interface RediscoveryPrompt {
  id: string;
  href: string;
  prompt: string;
  /** Reader-facing explanation for why this match belongs on the rail. */
  reason: string;
  line: string;
  year: string;
  score: string;
  scoreSuffix: string;
  opponent: string;
  tone: string;
  meta: string;
  /** Preformatted date line for rails — "17 Mar 2016 · Europa League". */
  dateLine: string;
  total: number;
}
