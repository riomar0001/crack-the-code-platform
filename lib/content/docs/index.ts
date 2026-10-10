import { conductDoc } from "./conduct";
import { privacyDoc } from "./privacy";
import { rulesDoc } from "./rules";
import { termsDoc } from "./terms";
import type { LegalDoc } from "./types";

/** Tab order on the document pages. */
export const legalDocs: LegalDoc[] = [rulesDoc, conductDoc, termsDoc, privacyDoc];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return legalDocs.find((doc) => doc.slug === slug);
}

export { conductDoc, privacyDoc, rulesDoc, termsDoc };
export type { DocBlock, DocClause, Inline, LegalDoc } from "./types";
