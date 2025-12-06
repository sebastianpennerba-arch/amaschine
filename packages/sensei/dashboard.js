// packages/sensei/dashboard.js
// Submodul 1 â€“ Sensei Overview / "AI Layer" Dashboard

function getNumbers(brand) {
  if (!brand) {
    return {
      spend30d: 0,
      roas30d: 0,
      estRevenue: 0,
      healthLabel: "n/a",
      healthBadge: "Neutral",
    };
  }

  const spend30d = brand.spend30d || 0;
  const roas30d = brand.roas30d || 0;
  const estRevenue = spend30d * roas30d;

  let healthLabel = "Unbekannt";
  let healthBadge = "Neutral";
  switch (brand.campaignHealth) {
    case "good":
      healthLabel = "Stark";
      healthBadge = "Positiv";
      break;
    case "warning":
      healthLabel = "Beobachten";
      healthBadge = "Neutral";
      break;
    case "critical":
      healthLabel = "Kritisch";
      healthBadge = "Alarm";
      break;
    default:
      break;
  }

  return { spend30d, roas30d, estRevenue, healthLabel, healthBadge };
}

export function renderSenseiOverview(root, AppState, DemoData, ctx) {
  const brand = ctx.brand || null;
  const campaign = ctx.campaign || null;

  const { spend30d, roas30d, estRevenue, healthLabel } = getNumbers(brand);

  const section = document.createElement("section");
  section.className = "sensei-layout";

  section.innerHTML = `
    <div class="sensei-main">
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">AD SPEND Â· LETZTE 30 TAGE</div>
          <div class="metric-value">${spend30d.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          })}</div>
          <div class="metric-subtext">
            Basierend auf ${
              ctx.isDemo ? "Meta Demo-Daten" : "aktuellen Meta-Daten"
            } fÃ¼r ${
    brand ? brand.name : "kein ausgewÃ¤hltes Werbekonto"
  }.
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">ROAS Â· LETZTE 30 TAGE</div>
          <div class="metric-value">${roas30d.toFixed(1)}x</div>
          <div class="metric-subtext">
            GeschÃ¤tzter Umsatz: ${estRevenue.toLocaleString("de-DE", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            })}
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">SENSEI BEWERTUNG</div>
          <div class="metric-value">${
            brand ? healthLabel : "n/a"
          }</div>
          <div class="metric-subtext">
            Fokus-Kampagne: ${
              campaign ? campaign.name : "aktuell keine Kampagne fokussiert"
            }
          </div>
        </div>
      </div>

      <div class="sensei-card" style="margin-top: 24px;">
        <div class="sensei-card-header">
          <div>
            <div class="sensei-card-title">Sensei Â· Executive Summary</div>
            <div class="sensei-card-subtitle">
              Sofort-Lagebild und High-Level Handlungsempfehlungen.
            </div>
          </div>
          <span class="sensei-ai-pill">
            <i class="fa-solid fa-bolt"></i> KI-Auswertung
          </span>
        </div>

        <p style="margin-bottom: 10px;">
          FÃ¼r <strong>${brand ? brand.name : "dein Konto"}</strong>${
    campaign ? ` (Kampagne: <strong>${campaign.name}</strong>)` : ""
  } sieht Sensei aktuell folgendes:
        </p>

        <ul style="margin-left: 16px; margin-bottom: 12px;">
          <li>Spend-Level ist ${
            spend30d > 50000 ? "hoch" : spend30d > 20000 ? "solide" : "moderat"
          } â€“ genug Daten fÃ¼r belastbare Entscheidungen.</li>
          <li>ROAS von <strong>${roas30d.toFixed(
            1
          )}x</strong> deutet auf klare Hebel Ã¼ber Creatives und Struktur hin.</li>
          <li>Campaign Health: <strong>${healthLabel}</strong> â€“ Sensei empfiehlt gezieltes Testing statt Full-Relaunch.</li>
        </ul>

        <div class="sensei-prompt-area">
          <label for="senseiOverviewPrompt" style="font-size:0.8rem;color:#64748b;">
            Eigene Frage an Sensei (Strategie, Struktur, Creatives):
          </label>
          <textarea
            id="senseiOverviewPrompt"
            class="sensei-prompt-textarea"
            placeholder="Beispiel: 'Gib mir eine neue Kampagnenstruktur fÃ¼r Q1 mit Fokus auf UGC und Hook-Testing.'"
          ></textarea>
          <button type="button" class="sensei-generate-button" id="senseiOverviewGenerate">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Antwort generieren (Demo)
          </button>
        </div>

        <div id="senseiOverviewResponse" style="margin-top:14px;font-size:0.86rem;color:#4b5563;display:none;">
        </div>
      </div>
    </div>

    <aside class="sensei-sidebar">
      <div class="sensei-card">
        <div class="sensei-card-header">
          <div>
            <div class="sensei-card-title">Sensei Snapshot</div>
            <div class="sensei-card-subtitle">Meta-Level Ãœbersicht</div>
          </div>
        </div>
        <ul style="margin-left: 16px;">
          <li><strong>Konto:</strong> ${brand ? brand.name : "noch nicht gewÃ¤hlt"}</li>
          <li><strong>Vertikale:</strong> ${
            brand ? brand.vertical : "â€“"
          }</li>
          <li><strong>Demo/Live:</strong> ${ctx.isDemo ? "Demo" : "Live"}</li>
          <li><strong>Aktive Kampagnen:</strong> ${
            brand && DemoData.campaignsByBrand && DemoData.campaignsByBrand[brand.id]
              ? DemoData.campaignsByBrand[brand.id].length
              : 0
          }</li>
        </ul>
      </div>

      <div class="sensei-card" style="margin-top: 18px;">
        <div class="sensei-card-header">
          <div>
            <div class="sensei-card-title">Quick Actions</div>
            <div class="sensei-card-subtitle">1-Klick-Einstiege</div>
          </div>
        </div>
        <ul style="margin-left: 16px;">
          <li>ðŸ“Š Struktur-Review fÃ¼r Top-Kampagne</li>
          <li>ðŸŽ¯ Zielgruppen-Overlap Check</li>
          <li>ðŸŽ¥ Creative Hook Heatmap</li>
          <li>ðŸ’° Budget-Neuverteilung nach ROAS</li>
        </ul>
      </div>
    </aside>
  `;

  // Layout-Klassen fÃ¼r den Wrapper anwenden (falls CSS auf class-names achtet)
  const main = section.querySelector(".sensei-main");
  const sidebar = section.querySelector(".sensei-sidebar");
  if (main && sidebar) {
    // nichts weiter nÃ¶tig, die Ã¤uÃŸere .sensei-layout kÃ¼mmert sich um das Grid
  }

  root.appendChild(section);

  // Interaktiv: Demo-"Antwort" fÃ¼r Prompt
  const promptEl = section.querySelector("#senseiOverviewPrompt");
  const generateBtn = section.querySelector("#senseiOverviewGenerate");
  const responseEl = section.querySelector("#senseiOverviewResponse");

  if (generateBtn && promptEl && responseEl) {
    generateBtn.addEventListener("click", () => {
      const value = String(promptEl.value || "").trim();
      if (!value) {
        if (window.SignalOne && window.SignalOne.showToast) {
          window.SignalOne.showToast(
            "Bitte eine konkrete Frage an Sensei eingeben.",
            "warning"
          );
        }
        return;
      }

      responseEl.style.display = "block";
      responseEl.innerHTML = `
        <strong>Sensei (Demo-Antwort):</strong>
        <p style="margin-top:6px;">
          Basierend auf deinem aktuellen Setup fÃ¼r <strong>${
            brand ? brand.name : "dein Konto"
          }</strong>${
        campaign ? ` und der Kampagne <strong>${campaign.name}</strong>` : ""
      }
          wÃ¼rde Sensei die Frage wie folgt angehen:
        </p>
        <ol style="margin-top:8px;margin-left:18px;">
          <li>Saubere Trennung von <strong>Prospecting / Testing / Scaling</strong>.</li>
          <li>Aufsetzen eines dedizierten <strong>Creative-Testing-Stacks</strong> mit 3â€“5 Hooks.</li>
          <li>Strukturierte <strong>Budget-Zuteilung</strong> entlang der Performance-Level (Top 20% Creatives hochfahren).</li>
          <li>Aufsetzen eines wÃ¶chentlichen <strong>Sensei-Reviews</strong> (Alerts + Testing-Log).</li>
        </ol>
        <p style="margin-top:6px;color:#6b7280;">
          Hinweis: Dies ist eine <strong>statische Demo-Antwort</strong>. In Live wird Sensei echte
          Meta-Daten und dein Testing-Log auswerten.
        </p>
      `;

      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast("Sensei Demo-Antwort generiert.", "success");
      }
    });
  }
}
