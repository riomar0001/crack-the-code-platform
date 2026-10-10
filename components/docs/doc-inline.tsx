import { Fragment } from "react";

import type { Inline } from "@/lib/content/docs";

/** Renders the inline run of a paragraph or list item. */
export function DocInline({ content }: { content: Inline[] }) {
  return (
    <>
      {content.map((part, index) => {
        if (typeof part === "string") {
          return <Fragment key={index}>{part}</Fragment>;
        }

        if ("bold" in part) {
          return <strong key={index}>{part.bold}</strong>;
        }

        return (
          <span key={index} className="ctc-code-inline">
            {part.code}
          </span>
        );
      })}
    </>
  );
}
