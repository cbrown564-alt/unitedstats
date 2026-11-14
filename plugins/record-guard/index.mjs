/**
 * record-guard: the EmDash native plugin that keeps editorial entries honest
 * against the record, and starts the publish snapshot.
 *
 * - `content:beforeSave` rejects an entry that names an unknown record ID, or a
 *   slug no code renders (guard.mjs).
 * - `content:afterPublish` / `content:afterUnpublish` send a repository_dispatch
 *   to GitHub. The publish workflow exports D1 to content/emdash/seed.json,
 *   validates, tests, commits and deploys (docs/EMDASH-MIGRATION-PLAN.md).
 *   Configure `githubRepo` and the write-only `githubToken` in the plugin's
 *   settings; until then publishes are logged and not snapshotted.
 */
import { ContentSaveRejectedError, definePlugin } from "emdash";
import { createGuard } from "./guard.mjs";
import index from "./record-index.json" with { type: "json" };

const check = createGuard(index);

async function dispatch(event, ctx, action) {
  const repo = await ctx.settings.get("githubRepo");
  const token = await ctx.settings.get("githubToken");
  const target = { action, collection: event.collection, id: event.content?.id ?? null, slug: event.content?.slug ?? null };
  if (!repo || !token) {
    ctx.log.warn("record-guard: GitHub dispatch not configured; publish not snapshotted", target);
    return;
  }
  const res = await ctx.http.fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "red-thread-record-guard",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ event_type: "emdash-publish", client_payload: target }),
  });
  if (res.status !== 204) ctx.log.error("record-guard: GitHub dispatch failed", { status: res.status, ...target });
  else ctx.log.info("record-guard: publish dispatched", target);
}

export function createPlugin() {
  return definePlugin({
    id: "record-guard",
    version: "0.1.0",
    capabilities: ["content:read", "content:write", "network:request"],
    allowedHosts: ["api.github.com"],
    admin: {
      settingsSchema: {
        githubRepo: { type: "string", label: "GitHub repository", description: "owner/name that runs the publish workflow" },
        githubToken: { type: "secret", label: "GitHub token", description: "Fine-grained token with Contents: write on that repository" },
      },
    },
    hooks: {
      "content:beforeSave": async (event) => {
        const problems = check(event.collection, event.content ?? {});
        if (problems.length > 0) throw new ContentSaveRejectedError(problems.join(" "));
        return event.content;
      },
      "content:afterPublish": (event, ctx) => dispatch(event, ctx, "publish"),
      "content:afterUnpublish": (event, ctx) => dispatch(event, ctx, "unpublish"),
    },
  });
}

