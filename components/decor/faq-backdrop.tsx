import { Halo } from "@/components/ui/halo";
import { bubbles, hexTileUrl } from "@/lib/content/decor";
import { cssVars } from "@/lib/css";

/** Hex lattice, a slow scanline and floating bubbles behind the FAQ. */
export function FaqBackdrop() {
  return (
    <div className="ctc-bleed" aria-hidden>
      <div className="ctc-hexfield" style={{ backgroundImage: hexTileUrl }} />
      <div className="ctc-scanline" />

      <div style={{ position: "absolute", left: "6%", top: "30%", width: 340, height: 340, opacity: 0.55 }}>
        <Halo size={340} speed={60} strokeWidth={1} inner />
      </div>

      {bubbles.map((bubble, index) => (
        <div
          key={`bubble-${index}`}
          className="ctc-bubble"
          style={cssVars({
            "--bubble-x": `${bubble.x}%`,
            "--bubble-y": `${bubble.y}%`,
            "--bubble-size": `${bubble.size}px`,
            "--bubble-dur": `${7 + index * 1.3}s`,
            "--bubble-delay": `${bubble.delay}s`,
            "--bubble-fill":
              index % 2
                ? "radial-gradient(circle at 35% 35%, rgb(255 255 255 / .9), rgb(111 211 255 / .25) 60%, rgb(111 211 255 / 0) 72%)"
                : "radial-gradient(circle at 35% 35%, rgb(255 255 255 / .9), rgb(255 216 77 / .25) 60%, rgb(255 216 77 / 0) 72%)",
          })}
        />
      ))}
    </div>
  );
}
