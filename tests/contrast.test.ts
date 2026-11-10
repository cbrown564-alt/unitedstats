import assert from "node:assert/strict";
import test from "node:test";

function luminance(hex: string): number {
  const channels = hex.match(/../g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const [r, g, b] = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("essential faint text meets WCAG AA on every product surface", () => {
  // Keep in step with the @theme tokens in app/globals.css.
  for (const background of ["1e1a18", "282320", "322c28"]) {
    for (const [name, ink] of [["ink-faint", "aa9f97"], ["ink-dim", "a89c94"]]) {
      assert.ok(contrast(ink, background) >= 4.5, `${name} fails on #${background}`);
    }
  }
});
