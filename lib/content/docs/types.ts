/**
 * A deliberately small document model for the Rules / Conduct / Terms /
 * Privacy pages. Rich enough for the markup those pages actually use
 * (bold run-in labels, inline code, bullet lists, sub-headings) without
 * pulling in a markdown pipeline or resorting to dangerouslySetInnerHTML.
 */

export type Inline = string | { bold: string } | { code: string };

export type DocBlock =
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "list"; items: Inline[][] }
  | { kind: "subheading"; text: string };

export type DocClause = {
  title: string;
  blocks: DocBlock[];
};

export type LegalDoc = {
  slug: string;
  /** Tab label and <h1>. */
  title: string;
  /** Used for the page <title> and meta description. */
  description: string;
  lede: string;
  clauses: DocClause[];
  /** Optional highlighted closing statement. */
  note?: string;
};

/* -------------------------------------------------------------------------
   Authoring helpers — keep the content files readable.
   ------------------------------------------------------------------------- */

export const p = (...content: Inline[]): DocBlock => ({ kind: "paragraph", content });

export const ul = (...items: (Inline[] | string)[]): DocBlock => ({
  kind: "list",
  items: items.map((item) => (typeof item === "string" ? [item] : item)),
});

export const h3 = (text: string): DocBlock => ({ kind: "subheading", text });

export const b = (bold: string): Inline => ({ bold });

export const code = (code: string): Inline => ({ code });
