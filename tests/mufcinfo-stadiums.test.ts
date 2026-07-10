import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeVenueKey,
  parseVenueFromHtml,
  resolveVenueId,
  splitVenueLabel,
} from "../scripts/mufcinfoVenues";

test("normalizeVenueKey folds case, punctuation, and HTML entities", () => {
  assert.equal(normalizeVenueKey("St James Park, Newcastle"), "st james park newcastle");
  assert.equal(normalizeVenueKey("John Smith&#039;s Stadium"), "john smiths stadium");
  assert.equal(normalizeVenueKey("Nou Camp"), "nou camp");
});

test("splitVenueLabel separates city, country, and parenthetical notes", () => {
  assert.deepEqual(splitVenueLabel("St James Park, Newcastle"), {
    name: "St James Park",
    city: "Newcastle",
    country: null,
    note: null,
  });
  assert.deepEqual(splitVenueLabel("North Road, (Monsall)"), {
    name: "North Road",
    city: null,
    country: null,
    note: "Monsall",
  });
  assert.deepEqual(splitVenueLabel("BJK Inonu Stadium, Turkey"), {
    name: "BJK Inonu Stadium",
    city: null,
    country: "Turkey",
    note: null,
  });
});

test("resolveVenueId maps aliases and disambiguates same-name grounds", () => {
  assert.equal(resolveVenueId("Nou Camp"), "camp-nou");
  assert.equal(resolveVenueId("Old Trafford"), "old-trafford");
  assert.equal(resolveVenueId("Eastlands Stadium"), "etihad-stadium");
  assert.equal(resolveVenueId("Britannia Stadium, Stoke"), "bet365-stadium");
  assert.equal(resolveVenueId("St James Park, Newcastle"), "st-james-park");
  assert.equal(resolveVenueId("St James Park, Exeter"), "st-james-park-exeter");
  assert.equal(resolveVenueId("North Road, (Monsall)"), "north-road");
  assert.equal(resolveVenueId("North Road, (Glossop)"), "north-road-glossop");
  assert.equal(resolveVenueId("Crystal Palace"), "crystal-palace-fa-cup");
  assert.equal(resolveVenueId("Villa Park"), "villa-park");
});

test("parseVenueFromHtml reads Venue line and strips H/A/N", () => {
  const html = `
    <td>Venue: Elland Road (A)<br />
    Attendance: 36919</td>
    <script type="application/ld+json">{"location":{"@type":"Place","name":"Elland Road"}}</script>
  `;
  assert.deepEqual(parseVenueFromHtml(html), { label: "Elland Road", ha: "A" });
});

test("parseVenueFromHtml falls back to JSON-LD location", () => {
  const html = `<script type="application/ld+json">{"location":{"@type":"Place","name":"Nou Camp"}}</script>`;
  assert.deepEqual(parseVenueFromHtml(html), { label: "Nou Camp", ha: null });
});
