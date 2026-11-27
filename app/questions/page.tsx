import { redirect } from "next/navigation";

/**
 * The /questions index was folded into /explore (Phase 11.5). It stays a real
 * page that redirects, so `/questions` keeps a route of its own.
 */
export default function QuestionsIndexPage() {
  redirect("/explore");
}
