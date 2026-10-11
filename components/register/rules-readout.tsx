import { DocClause } from "@/components/docs/doc-clause";
import { conductDoc, rulesDoc } from "@/lib/content/docs";

/**
 * The Rules followed by the Code of Conduct, laid out for the registration
 * modal. A server component: the text is rendered here and handed to the
 * client form as a node, so none of it ships as JavaScript.
 */
export function RulesReadout() {
  return (
    <div className="ctc-readout">
      {[rulesDoc, conductDoc].map((doc) => (
        <section key={doc.slug} aria-labelledby={`readout-${doc.slug}`}>
          <h2 id={`readout-${doc.slug}`} className="ctc-readout-title">
            {doc.title}
          </h2>
          <p className="ctc-readout-lede">{doc.lede}</p>

          {doc.clauses.map((clause, index) => (
            <DocClause key={clause.title} clause={clause} index={index + 1} plain />
          ))}

          {doc.note && (
            <p className="ctc-readout-note">
              <b>NOTE</b>
              {doc.note}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
