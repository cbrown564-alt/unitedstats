import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";

const redirects = JSON.parse(readFileSync("vercel.json", "utf8")).redirects as { source: string; destination: string }[];

test("deployment smoke accepts only protected, pending setup before the first seed", async (t) => {
  const cases = [
    { name: "live production", live: "live", allow: false, pending: false, protected: false, content: true, expected: 0 },
    { name: "strict check rejects an unseeded twin", live: "snapshot; unseeded", allow: false, pending: true, protected: true, content: true, expected: 1 },
    { name: "protected first setup", live: "snapshot; unseeded", allow: true, pending: true, protected: true, content: true, expected: 0 },
    { name: "empty content after setup", live: "snapshot; unseeded", allow: true, pending: false, protected: true, content: true, expected: 1 },
    { name: "unprotected wizard", live: "snapshot; unseeded", allow: true, pending: true, protected: false, content: true, expected: 1 },
    { name: "missing seed content", live: "snapshot; unseeded", allow: true, pending: true, protected: true, content: false, expected: 1 },
    { name: "database unavailable", live: "snapshot; unavailable", allow: true, pending: true, protected: true, content: true, expected: 1 },
  ];
  for (const scenario of cases) await t.test(scenario.name, async () => {
    const server = createServer((req, res) => {
      const redirect = redirects.find((r) => r.source === req.url);
      if (redirect) {
        res.writeHead(308, { location: redirect.destination }).end();
      } else if (req.url === "/_emdash/api/setup/status") {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ success: true, data: { needsSetup: scenario.pending, seedInfo: { hasContent: scenario.content } } }));
      } else if (req.url === "/_emdash/admin/setup") {
        res.writeHead(scenario.protected ? 404 : 200).end();
      } else {
        res.setHeader("x-redthread-live", scenario.live);
        res.end("Production page");
      }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
      const address = server.address();
      assert(address && typeof address !== "string");
      const args = ["scripts/check-worker-config.mjs", "production", "--smoke", `http://127.0.0.1:${address.port}`];
      if (scenario.allow) args.push("--allow-setup");
      const child = spawn(process.execPath, args);
      let output = "";
      child.stdout.on("data", (chunk) => { output += chunk; });
      child.stderr.on("data", (chunk) => { output += chunk; });
      const [code] = await once(child, "close");
      assert.equal(code, scenario.expected, output);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
