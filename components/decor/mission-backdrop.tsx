import { outlineWord, triangles } from "@/lib/content/decor";
import { cssVars } from "@/lib/css";

/** Full-bleed backdrop behind the mission section. */
export function MissionBackdrop() {
  return (
    <div className="ctc-bleed" aria-hidden>
      <div className="ctc-mission-fade" />

      <div className="ctc-outline-track">
        <span className="ctc-outline-word">{outlineWord.repeat(2)}</span>
        <span className="ctc-outline-word">{outlineWord.repeat(2)}</span>
      </div>

      <div className="ctc-dot-grid" />
      <div className="ctc-hatch" />

      {triangles.map((triangle, index) => (
        <div
          key={`tri-${index}`}
          className="ctc-tri"
          style={cssVars({
            "--tri-x": `${triangle.x}%`,
            "--tri-size": `${triangle.size}px`,
            "--tri-color": triangle.color,
            "--tri-dur": `${triangle.duration}s`,
            "--tri-delay": `${triangle.delay}s`,
          })}
        />
      ))}
    </div>
  );
}
