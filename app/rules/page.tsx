import type { Metadata } from "next";

import { DocPage } from "@/components/docs/doc-page";
import { pageMetadata } from "@/lib/seo";
import { rulesDoc } from "@/lib/content/docs";

export const metadata: Metadata = pageMetadata({
  title: rulesDoc.title,
  description: rulesDoc.description,
  path: "/rules",
});

export default function RulesPage() {
  return <DocPage doc={rulesDoc} />;
}
