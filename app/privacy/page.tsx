import type { Metadata } from "next";

import { DocPage } from "@/components/docs/doc-page";
import { pageMetadata } from "@/lib/seo";
import { privacyDoc } from "@/lib/content/docs";

export const metadata: Metadata = pageMetadata({
  title: privacyDoc.title,
  description: privacyDoc.description,
  path: "/privacy",
});

export default function PrivacyPage() {
  return <DocPage doc={privacyDoc} />;
}
