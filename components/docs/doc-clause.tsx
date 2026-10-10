import { DocInline } from "@/components/docs/doc-inline";
import { Reveal } from "@/components/ui/reveal";
import type { DocClause as DocClauseData } from "@/lib/content/docs";

type DocClauseProps = {
  clause: DocClauseData;
  /** 1-based, rendered as the monospace "01" gutter number. */
  index: number;
};

/** One numbered section of a legal document. */
export function DocClause({ clause, index }: DocClauseProps) {
  return (
    <Reveal className="ctc-clause">
      <div className="ctc-clause-num">{String(index).padStart(2, "0")}</div>

      <div className="ctc-clause-body">
        <h2>{clause.title}</h2>

        {clause.blocks.map((block, blockIndex) => {
          if (block.kind === "subheading") {
            return <h3 key={blockIndex}>{block.text.toUpperCase()}</h3>;
          }

          if (block.kind === "paragraph") {
            return (
              <p key={blockIndex}>
                <DocInline content={block.content} />
              </p>
            );
          }

          return (
            <ul key={blockIndex}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <DocInline content={item} />
                </li>
              ))}
            </ul>
          );
        })}
      </div>
    </Reveal>
  );
}
