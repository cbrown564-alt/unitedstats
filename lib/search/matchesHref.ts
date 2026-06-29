import type { SearchEntity } from "@/lib/search";
import { queryString } from "@/lib/url";

/** Map a search entity to a `/matches` slice — the evidence link the Matches browser shows as chips. */
export function entityMatchesHref(entity: SearchEntity): string {
  if (entity.kind === "match") return entity.href;
  if (entity.href.startsWith("/matches")) return entity.href;

  const id = decodeURIComponent(entity.href.split("/").pop() ?? "");
  switch (entity.kind) {
    case "opponent":
      return `/matches${queryString({ opponent: id })}`;
    case "player":
      return `/matches${queryString({ player: id })}`;
    case "manager":
      return `/matches${queryString({ manager: id })}`;
    case "season":
      return `/matches${queryString({ season: id })}`;
    case "competition":
      return `/matches${queryString({ competition: id })}`;
    case "stadium":
      return `/matches${queryString({ stadium: id })}`;
    case "city":
      return `/matches${queryString({ city: id })}`;
    default: {
      const _exhaustive: never = entity.kind;
      return _exhaustive;
    }
  }
}
