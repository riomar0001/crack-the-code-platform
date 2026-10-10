"use client";

import { Fragment, useId, useState } from "react";

import { Halo } from "@/components/ui/halo";
import { Reveal } from "@/components/ui/reveal";
import type { Mission } from "@/lib/content/missions";
import { cssVars } from "@/lib/css";

type MissionSelectProps = {
  missions: Mission[];
};

const num = (index: number) => String(index + 1).padStart(2, "0");

/** Vertical tab list on the left, detail panel on the right. */
export function MissionSelect({ missions }: MissionSelectProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const baseId = useId();

  const active = missions[activeIndex];
  const panelId = `${baseId}-panel`;

  /**
   * Arrow keys move between tabs. Both axes are accepted because the list is
   * vertical on desktop and a horizontal scroll strip on mobile.
   */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const step =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;

    if (!step) return;

    event.preventDefault();
    const next = (activeIndex + step + missions.length) % missions.length;
    setActiveIndex(next);

    // Focusing also scrolls the tab into view inside the mobile strip.
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <div className="ctc-missions-grid">
      <div
        className="ctc-missions-tabs"
        role="tablist"
        aria-label="Challenge categories"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
      >
        {missions.map((mission, index) => (
          <Reveal
            key={mission.slug}
            as="button"
            direction="left"
            delay={index * 70}
            className="ctc-mission-tab ctc-slant-trail-14"
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={index === activeIndex}
            aria-controls={panelId}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(index)}
          >
            <span className="ctc-mission-tab-num">{num(index)}</span>
            <span className="ctc-mission-tab-name">{mission.name}</span>
            <span className="ctc-mission-tab-arrow" aria-hidden>
              ▶
            </span>
          </Reveal>
        ))}
      </div>

      <Reveal
        direction="scale"
        delay={150}
        className="ctc-mission-panel ctc-notch-36"
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeIndex}`}
        tabIndex={0}
      >
        <div className="ctc-mission-panel-bg" aria-hidden>
          <Halo size={420} speed={50} strokeWidth={1} inner />
        </div>

        {/* Keyed on the mission so switching replays the staggered swap-in. */}
        <Fragment key={active.slug}>
          <div className="ctc-mission-slug" data-swap style={cssVars({ "--swap-index": 0 })}>
            <div className="ctc-chip ctc-chip--solid ctc-slant-8">FIELD {num(activeIndex)}</div>
            <code>/missions/{active.slug}</code>
          </div>

          <div className="ctc-mission-name" data-swap style={cssVars({ "--swap-index": 1 })}>
            {active.name}
          </div>

          <p className="ctc-mission-desc" data-swap style={cssVars({ "--swap-index": 2 })}>
            {active.description}
          </p>

          <div className="ctc-mission-expect" data-swap style={cssVars({ "--swap-index": 3 })}>
            <div className="ctc-mission-expect-label">EXPECT</div>
            <div className="ctc-mission-tags">
              {active.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </Fragment>
      </Reveal>
    </div>
  );
}
