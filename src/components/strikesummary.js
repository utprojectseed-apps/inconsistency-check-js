import React from "react";
import GameStrikes from "../game_data/gamestrikes";

// Compact strikes summary: shows very short reasons like "MISSING" or "<80".
export default function StrikesSummary({ strikes }) {
  if (!Array.isArray(strikes) || strikes.length === 0) return null;

  // Three contact levels. Only an explicit 0 counts as "no contact needed" —
  // a strike that never set a severity keeps falling through to CONTACT_1, so
  // nothing that existed before this function reads any differently.
  const resolveSeverity = (s) => {
    if (s.severity === GameStrikes.Severity.NONE) {
      return GameStrikes.Severity.NONE;
    }
    return s.severity === GameStrikes.Severity.CONTACT_2
      ? GameStrikes.Severity.CONTACT_2
      : GameStrikes.Severity.CONTACT_1;
  };

  const severityText = (sev) => {
    if (sev === GameStrikes.Severity.NONE) return "NO CONTACT NEEDED";
    return sev === GameStrikes.Severity.CONTACT_2
      ? "PHONE CALL NEEDED"
      : "TEXT MESSAGE NEEDED";
  };

  const renderLabel = (s) => {
    if (!s || !s.scenario) return "";
    if (s.scenario === "MISSING") return "Missing";
    if (s.scenario === "LIGHTS_OUT") return "Lights off 2h+ after playing";

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
          const shortLabel = renderLabel(s);
          const taskLabel = s.taskName || "";
          const sev = resolveSeverity(s);
          const sevText = severityText(sev);
          // Red means someone has to act. A no-contact strike still belongs in
          // this list, but it should not read as an action item at a glance.
          const color =
            sev === GameStrikes.Severity.NONE ? "#8a6d1f" : "#fe1818";
          const visible = `(${sevText}) ${shortLabel}${
            taskLabel ? ` - ${taskLabel}` : ""
          }`;
          const titleText = s.message ? `${sevText} — ${s.message}` : sevText;
          // A lights-out strike is judged by reading the two times it compared,
          // so they have to be on the page. A title tooltip does not survive
          // Ctrl+P or the highlights PDF, which is how these reports are read.
          const showsDetail = s.scenario === "LIGHTS_OUT";
          const notes = Array.isArray(s.notes) ? s.notes : [];
          return (
            <li
              key={i}
              title={titleText}
              style={{
                display: "flex",
                alignItems: showsDetail ? "flex-start" : "center",
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
                  flex: "none",
                  marginTop: showsDetail ? 5 : 0,
                }}
              />
              <span style={{ fontSize: 13, color, fontWeight: 700 }}>
                {visible}
                {showsDetail && s.message && (
                  <span
                    style={{ display: "block", fontWeight: 400, marginTop: 2 }}
                  >
                    {s.message}
                  </span>
                )}
                {showsDetail &&
                  notes.map((note, n) => (
                    <span
                      key={n}
                      style={{ display: "block", fontWeight: 400, marginTop: 2 }}
                    >
                      {"⚠ "}
                      {note}
                    </span>
                  ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
