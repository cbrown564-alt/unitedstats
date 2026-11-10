import assert from "node:assert/strict";
import test from "node:test";

async function loadBuildProfile(env: Record<string, string | undefined>) {
  for (const key of ["UNITEDSTATS_BUILD_PROFILE", "VERCEL_ENV"]) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  return import("../lib/build-profile");
}

async function loadStaticBuild(env: Record<string, string | undefined>) {
  for (const key of ["UNITEDSTATS_BUILD_PROFILE", "VERCEL_ENV"]) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  return import("../lib/static-build");
}

test("buildProfile defaults to full", async () => {
  const { buildProfile, isFullBuild } = await loadBuildProfile({});
  assert.equal(buildProfile(), "full");
  assert.equal(isFullBuild(), true);
});

test("buildProfile follows an explicit preview profile", async () => {
  const { buildProfile, isFullBuild } = await loadBuildProfile({
    UNITEDSTATS_BUILD_PROFILE: "preview",
  });
  assert.equal(buildProfile(), "preview");
  assert.equal(isFullBuild(), false);
});

test("buildProfile ignores the retired VERCEL_ENV preview signal", async () => {
  const { buildProfile } = await loadBuildProfile({ VERCEL_ENV: "preview" });
  assert.equal(buildProfile(), "full");
});

test("sampleStaticIds returns a stable preview subset", async () => {
  const { sampleStaticIds } = await loadStaticBuild({ UNITEDSTATS_BUILD_PROFILE: "preview" });
  const ids = Array.from({ length: 6000 }, (_, i) => `m-${i}`);
  const sampled = sampleStaticIds(ids);
  assert.equal(sampled.length, 24);
  assert.deepEqual(sampled, sampleStaticIds(ids));
});

test("sampleStaticIds returns all ids on full builds", async () => {
  const { sampleStaticIds } = await loadStaticBuild({ UNITEDSTATS_BUILD_PROFILE: "full" });
  const ids = ["a", "b", "c"];
  assert.deepEqual(sampleStaticIds(ids), ids);
});
