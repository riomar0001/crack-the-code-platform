import type { Metadata } from "next";

import { DocPage } from "@/components/docs/doc-page";
import { pageMetadata } from "@/lib/seo";
import { conductDoc } from "@/lib/content/docs";

export const metadata: Metadata = pageMetadata({
  title: conductDoc.title,
  description: conductDoc.description,
  path: "/conduct",
});

export default function ConductPage() {
  return <DocPage doc={conductDoc} />;
}
