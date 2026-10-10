import type { Metadata } from "next";

import { DocPage } from "@/components/docs/doc-page";
import { rulesDoc } from "@/lib/content/docs";

export const metadata: Metadata = {
  title: rulesDoc.title,
  description: rulesDoc.description,
};

export default function RulesPage() {
  return <DocPage doc={rulesDoc} />;
}
