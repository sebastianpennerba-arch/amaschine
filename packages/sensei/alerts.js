// packages/sensei/alerts.js
// Submodul 4 – AI Alerts & Prioritätenliste

function deriveAlerts(brand) {
  if (!brand) {
    return [
      {
        level: "info",
        title: "Keine Brand ausgewählt",
        text: "Wähle oben ein Werbekonto, damit Sensei Alerts generieren kann.",
      },
    ];
  }

  const alerts = [];

  if (brand.campaignHealth === "critical") {
    alerts.push({
      level: "critical",
      title: "Campaign Health kritisch",
      text: "Mindestens ein signifikanter Teil deines Spends läuft mit schwachem ROAS. Sensei empfiehlt ein strukturiertes Rebuild + frische Creatives.",
    });
  } else if (brand.campaignHealth === "warning") {
    alerts.push({
      level: "warning",
      title: "Campaign Health unter Beobachtung",
      text: "Dein ROAS ist noch akzeptabel, zeigt aber einen Rückgang. Fokus auf Testing neuer Hooks und Optimierung der Retargeting-Frequenzen.",
    });
  } else {
    alerts.push({
      level: "ok",
      title: "Campaign Health stabil",
      text: "Dein Konto ist grundsätzlich gesund. Fokus: Skalierung der Top-Creatives und Aufbau von LTV-Strecken.",
    });
  }

  alerts.push({
    level: "info",
    title: "Sensei Review empfohlen",
    text: "Plane einen wöchentlichen 20-Minuten Slot, in dem du die Alerts, das Dashboard und den Testing Log gemeinsam anschaust.",
  });

  return alerts;
}

export function renderSenseiAlerts(root, AppState, DemoData, ctx) {
  const brand = ctx.brand || null;
  const alerts = deriveAlerts(brand);

  const section = document.createElement("section");
  section.className = "sensei-card";

  section.innerHTML = `
    <div class="sensei-card-header">
      <div>
        <div class="sensei-card-title">Sensei · Alerts & Prioritäten</div>
        <div class="sensei-card-subtitle">
          Auto-generierte Hinweise für Performance-Risiken und Chancen.
        </div>
      </div>
      <span class="sensei-ai-pill">
        <i class="fa-solid fa-triangle-exclamation"></i>
        Priority Stack
      </span>
    </div>

    <ul id="senseiAlertsList" style="margin-left:16px;">
      ${alerts
        .map((a) => {
          let icon = "fa-circle-info";
          if (a.level === "critical") icon = "fa-fire";
          else if (a.level === "warning") icon = "fa-bell";

          return `
          <li style="margin-bottom:8px;">
            <strong>
              <i class="fa-solid ${icon}"></i>
              ${
                a.level === "critical"
                  ? "[KRITISCH]"
                  : a.level === "warning"
                  ? "[WARNUNG]"
                  : "[INFO]"
              }
            </strong>
            &nbsp;${a.title}<br/>
            <span style="font-size:0.86rem;color:#4b5563;">${a.text}</span>
          </li>
        `;
        })
        .join("")}
    </ul>

    <p style="margin-top:8px;font-size:0.8rem;color:#6b7280;">
      Später wird Sensei hier echte <strong>Realtime Alerts</strong> anzeigen
      (Spend-Anomalien, ROAS-Drops, Tracking-Probleme, Creative-Fatigue).
    </p>
  `;

  root.appendChild(section);
}
