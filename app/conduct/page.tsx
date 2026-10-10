import type { Metadata } from "next";

import { DocPage } from "@/components/docs/doc-page";
import { conductDoc } from "@/lib/content/docs";

export const metadata: Metadata = {
  title: conductDoc.title,
  description: conductDoc.description,
};

export default function ConductPage() {
  return <DocPage doc={conductDoc} />;
}
