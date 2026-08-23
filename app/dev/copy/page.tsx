import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyStudio } from "@/components/dev/CopyStudio";
import { copyStudioEnabled, loadCopyCatalog, loadCopyQueue } from "@/lib/copyCatalog";

export const metadata: Metadata = {
  title: "Copy Studio",
  robots: { index: false, follow: false },
};

/**
 * Dev-only copy review surface. 404 in production builds.
 * Catalog is read from content/copy-catalog.json. Queue status is read/written
 * via a temp runtime file so Studio saves do not trip Fast Refresh.
 */
export default function CopyStudioPage() {
  if (!copyStudioEnabled()) notFound();

  const catalog = loadCopyCatalog();
  const queue = loadCopyQueue();

  return <CopyStudio items={catalog.items} initialEntries={queue.entries} />;
}
