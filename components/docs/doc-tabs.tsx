"use client";

import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";
import { legalDocs } from "@/lib/content/docs";

/**
 * Switcher across the four legal documents.
 *
 * Client-side so `Link` can be handed to `Reveal`'s `as` prop — a component
 * reference cannot cross the server/client boundary as a prop.
 */
export function DocTabs({ activeSlug }: { activeSlug: string }) {
  return (
    <nav className="ctc-doc-tabs" aria-label="Documents">
      {legalDocs.map((doc, index) => (
        <Reveal
          key={doc.slug}
          as={Link}
          delay={index * 60}
          href={`/${doc.slug}`}
          className="ctc-doc-tab ctc-slant-8"
          aria-current={doc.slug === activeSlug ? "page" : undefined}
        >
          {doc.title}
        </Reveal>
      ))}
    </nav>
  );
}
