import type { Metadata } from "next";

import { DocPage } from "@/components/docs/doc-page";
import { privacyDoc } from "@/lib/content/docs";

export const metadata: Metadata = {
  title: privacyDoc.title,
  description: privacyDoc.description,
};

export default function PrivacyPage() {
  return <DocPage doc={privacyDoc} />;
}
