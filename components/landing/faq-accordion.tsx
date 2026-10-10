"use client";

import { useId, useState } from "react";

import { Reveal } from "@/components/ui/reveal";
import type { Faq } from "@/lib/content/faqs";

type FaqAccordionProps = {
  faqs: Faq[];
};

/** One answer open at a time; clicking the open question closes it. */
export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const baseId = useId();

  return (
    <div className="ctc-faq-list">
      {faqs.map((faq, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-answer-${index}`;
        const triggerId = `${baseId}-question-${index}`;

        return (
          <Reveal
            key={faq.question}
            delay={index * 80}
            className="ctc-faq-card ctc-notch-16"
            data-open={open}
          >
            <div className="ctc-faq-bar" aria-hidden />

            <button
              type="button"
              id={triggerId}
              className="ctc-faq-trigger"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? -1 : index)}
            >
              <span className="ctc-faq-num">{String(index + 1).padStart(2, "0")}</span>
              <span className="ctc-faq-q">{faq.question}</span>
              <span className="ctc-faq-icon" aria-hidden>
                <i />
                <i />
              </span>
            </button>

            <div className="ctc-faq-panel" id={panelId} role="region" aria-labelledby={triggerId}>
              <div>
                <p>{faq.answer}</p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
