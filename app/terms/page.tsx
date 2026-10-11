import type { Metadata } from "next";

import { DocPage } from "@/components/docs/doc-page";
import { pageMetadata } from "@/lib/seo";
import { termsDoc } from "@/lib/content/docs";

export const metadata: Metadata = pageMetadata({
  title: termsDoc.title,
  description: termsDoc.description,
  path: "/terms",
});

export default function TermsPage() {
  return <DocPage doc={termsDoc} />;
}
