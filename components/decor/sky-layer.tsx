import { clouds, sparks } from "@/lib/content/decor";
import { cssVars } from "@/lib/css";

/** Drifting clouds, twinkling sparks and raking light over the sky gradient. */
export function SkyLayer() {
  return (
    <div className="ctc-sky" aria-hidden>
      <div className="ctc-sky-stripes" />

      {clouds.map((cloud, index) => (
        <div
          key={`cloud-${index}`}
          className="ctc-cloud"
          style={cssVars({
            "--cloud-top": cloud.top,
            "--cloud-w": `${cloud.width}px`,
            "--cloud-dur": `${cloud.duration}s`,
            "--cloud-delay": `${cloud.delay}s`,
            "--cloud-opacity": cloud.opacity,
          })}
        />
      ))}

      {sparks.map(([x, y], index) => (
        <div
          key={`spark-${index}`}
          className="ctc-spark"
          style={cssVars({
            "--spark-x": `${x}%`,
            "--spark-y": `${y}%`,
            "--spark-color": index % 3 === 0 ? "var(--ctc-yellow)" : "#fff",
            "--spark-dur": `${2.4 + (index % 4) * 0.7}s`,
            "--spark-delay": `${index * 0.45}s`,
          })}
        />
      ))}
    </div>
  );
}
