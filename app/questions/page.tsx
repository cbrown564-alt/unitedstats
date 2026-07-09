import { redirect } from "next/navigation";

/**
 * The /questions index was folded into /explore (Phase 11.5). Keep a real page
 * here so the App Router / Turbopack always have a loader tree for `/questions`
 * (a bare next.config redirect left Turbopack panicking on HMR and death-
 * spiraling Fast Refresh on unrelated routes like /dev/copy).
 */
export default function QuestionsIndexPage() {
  redirect("/explore");
}
