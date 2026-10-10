import type { Metadata } from "next";

import { DocPage } from "@/components/docs/doc-page";
import { termsDoc } from "@/lib/content/docs";

export const metadata: Metadata = {
  title: termsDoc.title,
  description: termsDoc.description,
};

export default function TermsPage() {
  return <DocPage doc={termsDoc} />;
}
