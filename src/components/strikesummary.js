import React from "react";
import GameStrikes from "../game_data/gamestrikes";

// Compact strikes summary: shows very short reasons like "MISSING" or "<80".
export default function StrikesSummary({ strikes }) {
  if (!Array.isArray(strikes) || strikes.length === 0) return null;

  const renderLabel = (s) => {
    if (!s || !s.scenario) return "";
    if (s.scenario === "MISSING") return "Missing";

    // For COMPLETION and ACCURACY show the threshold that was crossed, e.g. <80
    const sev =
      s.severity === GameStrikes.Severity.CONTACT_2
        ? GameStrikes.Severity.CONTACT_2
        : GameStrikes.Severity.CONTACT_1;
    if (s.scenario === "COMPLETION") {
      const thresh =
        sev === GameStrikes.Severity.CONTACT_2
          ? GameStrikes.COMPLETION_THRESHOLDS.CONTACT_2
          : GameStrikes.COMPLETION_THRESHOLDS.CONTACT_1;
      return `Completion < ${Math.round(thresh * 100)}`;
    }
    if (s.scenario === "ACCURACY") {
      // detect BDS using explicit flag or stable task name
      const isBDS = s.isBDS === true || s.task === "BDS" || s.taskName === "BDS";
      const thresholds =
        isBDS && GameStrikes.ACCURACY_THRESHOLDS.BDS
          ? GameStrikes.ACCURACY_THRESHOLDS.BDS
          : GameStrikes.ACCURACY_THRESHOLDS;
      const displaySeverity =
        typeof s.triggerSeverity !== "undefined" ? s.triggerSeverity : s.severity;
      const thresh =
        displaySeverity === GameStrikes.Severity.CONTACT_2
          ? thresholds.CONTACT_2
          : thresholds.CONTACT_1;
      return `Accuracy < ${Math.round(thresh * 100)}`;
    }
    return s.scenario;
  };

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontWeight: 600, color: "#000", fontSize: 13 }}>
        Strikes:
      </div>
      <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: 6 }}>
        {strikes.map((s, i) => {
          const color = "#fe1818";
          const shortLabel = renderLabel(s);
          const taskLabel = s.taskName || "";
          const sev =
            s.severity === GameStrikes.Severity.CONTACT_2
              ? GameStrikes.Severity.CONTACT_2
              : GameStrikes.Severity.CONTACT_1;
          const sevText =
            sev === GameStrikes.Severity.CONTACT_2
              ? "PHONE CALL NEEDED"
              : "TEXT MESSAGE NEEDED";
          const visible = `(${sevText}) ${shortLabel}${
            taskLabel ? ` - ${taskLabel}` : ""
          }`;
          const titleText = s.message ? `${sevText} — ${s.message}` : sevText;
          return (
            <li
              key={i}
              title={titleText}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: color,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 13, color, fontWeight: 700 }}>
                {visible}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
