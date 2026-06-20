<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CI: knip

CI runs `npm run knip`, which fails on unused files. Standalone scripts under `scripts/` are treated as entry points via a glob in `knip.json`, so adding a new one-off script there won't break the build. Put new operational/ingest scripts under `scripts/` (not elsewhere) so this coverage applies.
