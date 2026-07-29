"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";

type TransferDestination = "season" | "player" | "manager" | "match" | "opponent" | "evidence";

export function TransferHistoryLink({
  destination,
  source,
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & {
  destination: TransferDestination;
  source: string;
}) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        track("transfer_history_follow", { destination, source });
        onClick?.(event);
      }}
    />
  );
}
