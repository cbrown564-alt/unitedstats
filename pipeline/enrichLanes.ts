export interface EnrichLane {
  id: string;
  command: string;
  args: string[];
}

export function enrichLanes(opts: {
  write: boolean;
  refresh: boolean;
}): EnrichLane[] {
  const write = opts.write ? ["--write"] : [];
  const refresh = opts.refresh ? ["--refresh"] : [];
  return [
    {
      id: "wikipedia",
      command: "npm",
      args: ["run", "ingest:wikipedia", "--", "current", "--reparse"],
    },
    {
      id: "transfermarkt",
      command: "npm",
      args: ["run", "ingest:transfermarkt", "--", "current", ...write, ...refresh],
    },
    {
      id: "mufcinfo-lineups",
      command: "npm",
      args: ["run", "ingest:mufcinfo-lineups", "--", "current", ...write, ...refresh],
    },
    {
      id: "mufcinfo-stadiums",
      command: "npm",
      args: ["run", "ingest:mufcinfo-stadiums", "--", "current", ...write, ...refresh],
    },
    {
      id: "mufcinfo-assists",
      command: "npm",
      args: ["run", "ingest:mufcinfo-assists", "--", "current", ...write, ...refresh],
    },
    {
      id: "mufcinfo-opposition-goals",
      command: "npm",
      args: ["run", "ingest:mufcinfo-opposition-goals", "--", "current", ...write, ...refresh],
    },
    {
      id: "positions",
      command: "npm",
      args: ["run", "ingest:positions"],
    },
  ];
}
