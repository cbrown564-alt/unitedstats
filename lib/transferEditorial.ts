/**
 * Reviewed one-line notes for deals whose story the structured record cannot
 * tell on its own — the authored layer the plan keeps for historical
 * significance (Dimension F). Keep this list small: every line must be
 * defensible from the record, and a deal without one simply shows no note
 * rather than a generated restatement of fields the receipt already renders.
 */
const CURATED_NOTES: Record<string, string> = {
  "2016-08-09-paul-pogba-in": "Left on a free in 2012; bought back for £80m in 2016.",
  "2009-07-01-cristiano-ronaldo-out":
    "£80m to Real Madrid after six seasons — still the club's record sale.",
  "1992-11-27-eric-cantona-in":
    "£1.2m from Leeds in November 1992 — the signing that unlocked the first league title in 26 years.",
};

export function curatedTransferNote(transferId: string): string | null {
  return CURATED_NOTES[transferId] ?? null;
}
