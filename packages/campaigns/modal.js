// packages/campaigns/campaigns.modal.js
// Campaign Deep Dive Modal (Detailansicht)

import { openModal } from "../../uiCore.js";

function fEuro(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    });
}

function fPct(v) {
    const n = Number(v || 0);
    return `${n.toFixed(2)}%`;
}

function fInt(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE");
}

export function openCampaignDetailModal(campaign) {
    const title = campaign.name || "Campaign Detail";

    const badgeClass =
        campaign.roas >= 3
            ? "campaign-trend-good"
            : campaign.roas >= 1
            ? "campaign-trend-neutral"
            : "campaign-trend-bad";

    const bodyHtml = `
        <div class="campaign-modal-grid">
            <div class="campaign-modal-col">
                <div class="campaign-modal-section">
                    <h3>Meta Kampagne</h3>
                    <p class="campaign-meta-line"><strong>Objective:</strong> ${
                        campaign.objective || "n/a"
                    }</p>
                    <p class="campaign-meta-line"><strong>Status:</strong> ${
                        campaign.status || "n/a"
                    }</p>
                    <p class="campaign-meta-line"><strong>Daily Budget:</strong> ${fEuro(
                        campaign.dailyBudget
                    )}</p>
                    <span class="campaign-trend-badge ${badgeClass}">
                        ROAS ${ (campaign.roas || 0).toFixed(2) }x
                    </span>
                </div>

                <div class="campaign-modal-section">
                    <h4>KPIs (letzte 30 Tage)</h4>
                    <div class="campaign-kpi-grid">
                        <div class="kpi-row">
                            <span class="kpi-row-label">Spend</span>
                            <span class="kpi-row-value">${fEuro(campaign.spend)}</span>
                        </div>
                        <div class="kpi-row">
                            <span class="kpi-row-label">Impressions</span>
                            <span class="kpi-row-value">${fInt(
                                campaign.impressions
                            )}</span>
                        </div>
                        <div class="kpi-row">
                            <span class="kpi-row-label">Clicks</span>
                            <span class="kpi-row-value">${fInt(campaign.clicks)}</span>
                        </div>
                        <div class="kpi-row">
                            <span class="kpi-row-label">CTR</span>
                            <span class="kpi-row-value">${fPct(campaign.ctr)}</span>
                        </div>
                        <div class="kpi-row">
                            <span class="kpi-row-label">ROAS</span>
                            <span class="kpi-row-value">${(campaign.roas || 0).toFixed(
                                2
                            )}x</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="campaign-modal-col">
                <div class="campaign-modal-section">
                    <h4>Sensei Story</h4>
                    <p class="campaign-story">
                        ${
                            campaign.roas >= 3
                                ? "Diese Kampagne ist ein klarer Gewinner. Prüfe, ob Budget-Upscaling möglich ist, ohne die Effizienz zu verlieren."
                                : campaign.roas >= 1
                                ? "Solide Performance mit Luft nach oben. Gute Kandidatin für Creative-Tests und Landing Page Optimierung."
                                : "Unterhalb des Ziels. Kandidatin für Budget-Reduktion oder komplette Abschaltung, sofern kein strategischer Grund dagegen spricht."
                        }
                    </p>
                    <p class="campaign-sensei-text">
                        <strong>Empfehlung:</strong> Nutze diese Kampagne als Referenz im Sensei Strategy Center, um konkrete nächste Schritte zu definieren.
                    </p>
                </div>

                <div class="campaign-modal-section">
                    <h4>Aktionen</h4>
                    <p class="campaign-note">
                        Im Live-System würden hier direkte Meta API Calls ausgeführt werden (Pause, Budget ändern, Dupes).
                    </p>
                    <div class="campaign-actions-row">
                        <button class="action-button-secondary">In Testing Log übernehmen</button>
                        <button class="action-button">Budget anpassen</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    openModal(title, bodyHtml);
}
