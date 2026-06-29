/** Lowercase surname particles that bind to the following token(s). */
const SURNAME_PARTICLES = new Set([
  "van", "von", "de", "del", "da", "dos", "di", "du", "le", "la",
  "ter", "ten", "der", "den", "op", "el", "al", "bin", "ibn",
]);

/** Family / surname for compact labels — handles particles like de, van, van der. */
export function familyName(fullName: string): string {
  const name = fullName.replace(/^Sir\s+/i, "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;

  let start = parts.length - 1;
  while (start > 0 && SURNAME_PARTICLES.has(parts[start - 1].toLowerCase().replace(/\.$/, ""))) {
    start--;
  }
  return parts.slice(start).join(" ");
}

/** Two-letter initials: given name + last token of the family name. */
export function initialsFor(name: string): string {
  const given = name.replace(/^Sir\s+/i, "").trim().split(/\s+/).filter(Boolean)[0];
  const familyParts = familyName(name).split(/\s+/).filter(Boolean);
  const a = given?.[0]?.toUpperCase() ?? "";
  const b = familyParts[familyParts.length - 1]?.[0]?.toUpperCase() ?? "";
  return a + b || "?";
}
