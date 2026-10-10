import { SkyLayer } from "@/components/decor/sky-layer";
import { DocClause } from "@/components/docs/doc-clause";
import { DocTabs } from "@/components/docs/doc-tabs";
import { Reveal } from "@/components/ui/reveal";
import type { LegalDoc } from "@/lib/content/docs";
import { site } from "@/lib/site";

/**
 * Shared shell for Rules / Code of Conduct / Terms / Privacy. Each route is a
 * thin wrapper that hands its document to this component.
 */
export function DocPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <section className="ctc-sky-section">
        <SkyLayer />

        <div className="ctc-doc-hero">
          <div>
            <div className="ctc-eyebrow">PROTOCOLS</div>
            <Reveal as="h1" className="ctc-doc-title">
              {doc.title}
            </Reveal>
            <div className="ctc-doc-updated">Last updated {site.docsUpdated}</div>
          </div>

          <DocTabs activeSlug={doc.slug} />
        </div>
      </section>

      <section className="ctc-doc-body">
        <p className="ctc-doc-lede">{doc.lede}</p>

        {doc.clauses.map((clause, index) => (
          <DocClause key={clause.title} clause={clause} index={index + 1} />
        ))}

        {doc.note && (
          <Reveal className="ctc-doc-note ctc-notch-16">
            <b>NOTE</b>
            {doc.note}
          </Reveal>
        )}
      </section>
    </>
  );
}
