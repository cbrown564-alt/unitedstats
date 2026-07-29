import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OgDesignLab } from "@/components/dev/OgDesignLab";
import { TransferOgLabPanel } from "@/components/dev/TransferOgLabPanel";

export const metadata: Metadata = {
  title: "OpenGraph design lab",
  robots: { index: false, follow: false },
};

export default function OgDesignLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="space-y-10">
      <OgDesignLab />
      <TransferOgLabPanel />
    </div>
  );
}
