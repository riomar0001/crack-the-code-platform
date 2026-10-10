"use client";

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
} from "react";

import { cssVars } from "@/lib/css";

/**
 * Fades and slides its element in once it scrolls into view.
 *
 * Renders *as* the element you ask for rather than wrapping it, so it can be
 * dropped onto a flex or grid child without disturbing the layout:
 *
 *   <Reveal as="h1" delay={100} className="ctc-hero-title">…</Reveal>
 *   <Reveal as="button" type="button" onClick={…}>…</Reveal>
 *
 * Markup starts at `data-revealed="false"` so there is no flash of visible
 * content before hydration. `app/layout.tsx` ships a `<noscript>` override
 * that forces everything visible when JavaScript is unavailable.
 */

type RevealDirection = "up" | "left" | "right" | "scale";

type RevealOwnProps<T extends ElementType> = {
  /** Element or component to render as. Defaults to a `div`. */
  as?: T;
  direction?: RevealDirection;
  /** Stagger, in milliseconds. */
  delay?: number;
  style?: CSSProperties;
};

type RevealProps<T extends ElementType> = RevealOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof RevealOwnProps<T>>;

/** One observer for the whole page, shared by every Reveal instance. */
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;

  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-revealed", "true");
        observer?.unobserve(entry.target);
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
  );

  return observer;
}

export function Reveal<T extends ElementType = "div">({
  as,
  direction = "up",
  delay = 0,
  style,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const io = getObserver();

    // Without IntersectionObserver, just show the content.
    if (!io) {
      element.setAttribute("data-revealed", "true");
      return;
    }

    io.observe(element);
    return () => io.unobserve(element);
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={direction}
      data-revealed="false"
      style={delay ? cssVars({ "--reveal-delay": `${delay}ms` }, style) : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
