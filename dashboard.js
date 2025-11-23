// dashboard.js – Dashboard KPIs, Charts, Top-Kampagnen

import { AppState } from "./state.js";
import {
    fetchMetaAdAccounts,
    fetchMetaCampaigns,
    fetchMetaCampaignInsights
} from "./metaApi.js";

const summaryElId = "dashboardMetaSummary";

function setDashboardSummary(text) {
    const el = document.getElementById(summaryElId);
    if (el) el.textContent = text;
}

function buildTimeRangeLabel(dateStartStr, dateStopStr) {
    if (!dateStartStr || !dateStopStr) return "Standard (Meta Zeitraum)";

    const start = new Date(dateStartStr);
    const stop = new Date(dateStopStr);
    if (isNaN(start) || isNaN(stop)) return "Standard (Meta Zeitraum)";

    const diffMs = stop - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    const sameDay =
        start.getFullYear() === stop.getFullYear() &&
        start.getMonth() === stop.getMonth() &&
        start.getDate() === stop.getDate();

    if (sameDay) return start.toLocaleDateString("de-DE");
    if (diffDays === 7) return "Letzte 7 Tage";
    if (diffDays === 30) return "Letzte 30 Tage";

    return `${start.toLocaleDateString("de-DE")} – ${stop.toLocaleDateString(
        "de-DE"
    )}`;
}

function renderDashboardKpisPlaceholder() {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-coins"></i> Ad Spend</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-percentage"></i> ROAS</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-mouse-pointer"></i> CTR</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-chart-area"></i> CPM</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
        </div>
    `;
}

function renderDashboardKpisLive(metrics) {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    const safe = (v, unit = "") => {
        const n = Number(v);
        if (!isFinite(n)) return "–";
        if (n === 0) return "0";
        if (unit === "€") return `€ ${n.toLocaleString("de-DE")}`;
        if (unit === "%") return `${n.toFixed(2)}%`;
        if (unit === "x") return `${n.toFixed(2)}x`;
        return n.toString();
    };

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-coins"></i> Ad Spend</div>
                <div class="kpi-value">${safe(metrics.spend, "€")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-percentage"></i> ROAS</div>
                <div class="kpi-value">${safe(metrics.roas, "x")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-mouse-pointer"></i> CTR</div>
                <div class="kpi-value">${safe(metrics.ctr, "%")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-chart-area"></i> CPM</div>
                <div class="kpi-value">${safe(metrics.cpm, "€")}</div>
            </div>
        </div>
    `;
}

function renderDashboardChart(metrics) {
    const container = document.getElementById("dashboardChartContainer");
    if (!container) return;

    if (!metrics) {
        container.innerHTML = `
            <div class="card performance-card">
                <div class="card-header">
                    <h3>Performance Profil</h3>
                </div>
                <div class="chart-placeholder">
                    Verbinde Meta, um deinen Performance-Zeitraum zu sehen.
                </div>
            </div>
        `;
        return;
    }

    const spend = Number(metrics.spend) || 0;
    const roas = Number(metrics.roas) || 0;
    const ctr = Number(metrics.ctr) || 0;
    const cpm = Number(metrics.cpm) || 0;
    const impressions = Number(metrics.impressions) || 0;
    const clicks = Number(metrics.clicks) || 0;

    const items = [
        { key: "spend", label: "Spend", value: spend, formatted: spend > 0 ? `€ ${spend.toLocaleString("de-DE")}` : "0" },
        { key: "roas", label: "ROAS", value: roas, formatted: roas > 0 ? `${roas.toFixed(2)}x` : "0" },
        { key: "ctr", label: "CTR", value: ctr, formatted: ctr > 0 ? `${ctr.toFixed(2)}%` : "0" },
        { key: "cpm", label: "CPM", value: cpm, formatted: cpm > 0 ? `€ ${cpm.toFixed(2)}` : "0" }
    ];

    const maxVal = Math.max(...items.map((i) => i.value || 0), 1);

    const rowsHtml = items
        .map((i) => {
            const pct =
                i.value > 0 ? Math.max(8, Math.min(100, (i.value / maxVal) * 100)) : 8;
            return `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:110px; font-size:12px; color:var(--text-secondary);">${i.label}</div>
                <div style="flex:1; height:8px; border-radius:999px; background:rgba(148,163,184,0.35); overflow:hidden;">
                    <div style="width:${pct}%; height:100%; border-radius:inherit; background:var(--color-primary);"></div>
                </div>
                <div style="width:90px; text-align:right; font-size:12px; color:var(--text-primary);">${i.formatted}</div>
            </div>`;
        })
        .join("");

    container.innerHTML = `
        <div class="card performance-card">
            <div class="card-header">
                <div>
                    <h3>Performance Profil</h3>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                        Basis: ${metrics.scopeLabel} • Zeitraum: ${metrics.timeRangeLabel}
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                        Impressionen: ${impressions.toLocaleString(
                            "de-DE"
                        )} • Klicks: ${clicks.toLocaleString("de-DE")}
                    </div>
                </div>
            </div>
            <div class="chart-placeholder">
                <div style="width:100%; max-width:640px; display:flex; flex-direction:column; gap:12px;">
                    ${rowsHtml}
                </div>
            </div>
        </div>
    `;
}

function renderDashboardHeroCreatives() {
    const container = document.getElementById("dashboardHeroCreativesContainer");
    if (!container) return;

    const entries = Object.entries(AppState.meta.insightsByCampaign || {});
    const campaigns = AppState.meta.campaigns || [];

    if (!AppState.metaConnected || !entries.length || !campaigns.length) {
        container.innerHTML = `
            <div class="card">
                <h3>Top-Kampagnen</h3>
                <p style="color: var(--text-secondary); font-size:14px; margin-top:8px;">
                    Sobald deine Kampagnen mit Spend und Ergebnissen laufen, siehst du hier deine stärksten Kampagnen.
                </p>
            </div>
        `;
        return;
    }

    const enriched = entries.map(([id, m]) => {
        const camp = campaigns.find((c) => c.id === id) || { name: id };
        return {
            id,
            name: camp.name || id,
            spend: m.spend || 0,
            roas: m.roas || 0,
            ctr: m.ctr || 0
        };
    });

    enriched.sort((a, b) => {
        const aScore = (a.roas || 0) * (a.spend || 0);
        const bScore = (b.roas || 0) * (b.spend || 0);
        return bScore - aScore;
    });

    const top3 = enriched.slice(0, 3);

    container.innerHTML = `
        <div class="card" style="margin-bottom: 16px;">
            <h3 style="margin-bottom: 8px;">Top-Kampagnen (Impact-basiert)</h3>
            <p style="color: var(--text-secondary); font-size:12px;">
                Ranking nach Spend × ROAS im gewählten Zeitraum.
            </p>
        </div>
        <div class="hero-grid">
            ${top3
                .map(
                    (c, idx) => `
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:18px;color:var(--text-secondary);background:rgba(15,23,42,0.85);">
                            #${idx + 1}
                        </div>
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">${c.name}</div>
                        <div class="creative-kpi-bar">
                            <span>ROAS</span>
                            <span class="kpi-value-mini">${
                                c.roas > 0 ? c.roas.toFixed(2) + "x" : "0"
                            }</span>
                        </div>
                        <div class="creative-kpi-bar">
                            <span>Spend</span>
                            <span class="kpi-value-mini">${
                                c.spend > 0
                                    ? "€ " + c.spend.toLocaleString("de-DE")
                                    : "0"
                            }</span>
                        </div>
                        <div class="creative-kpi-bar">
                            <span>CTR</span>
                            <span class="kpi-value-mini">${
                                c.ctr > 0 ? c.ctr.toFixed(2) + "%" : "0"
                            }</span>
                        </div>
                    </div>
                </div>`
                )
                .join("")}
        </div>
    `;
}

function storeCampaignInsightInCache(campaignId, d, preset) {
    if (!AppState.meta.insightsByCampaign) {
        AppState.meta.insightsByCampaign = {};
    }

    const spend = Number(d.spend || 0);
    let roas = 0;
    if (Array.isArray(d.website_purchase_roas) && d.website_purchase_roas.length > 0) {
        roas = Number(d.website_purchase_roas[0].value || 0);
    }
    const ctr = Number(d.ctr || 0);
    const cpm = Number(d.cpm || 0);

    AppState.meta.insightsByCampaign[campaignId] = {
        spend,
        roas,
        ctr,
        cpm,
        raw: d,
        rawPreset: preset
    };
}

async function aggregateInsightsForCampaigns(campaignIds, datePreset) {
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let roasWeightedSum = 0;
    let roasWeight = 0;
    let minStart = null;
    let maxStop = null;

    for (const id of campaignIds) {
        try {
            const cached = AppState.meta.insightsByCampaign[id];
            let d;

            if (cached && cached.raw && cached.rawPreset === datePreset) {
                d = cached.raw;
            } else {
                const insights = await fetchMetaCampaignInsights(id, datePreset);
                if (
                    !insights.success ||
                    !insights.data ||
                    !Array.isArray(insights.data.data) ||
                    insights.data.data.length === 0
                ) {
                    continue;
                }
                d = insights.data.data[0];
                storeCampaignInsightInCache(id, d, datePreset);
            }

            if (!d) continue;

            const spend = parseFloat(d.spend || "0") || 0;
            const impressions = parseFloat(d.impressions || "0") || 0;
            const clicks = parseFloat(d.clicks || "0") || 0;

            let roasVal = 0;
            if (
                Array.isArray(d.website_purchase_roas) &&
                d.website_purchase_roas.length > 0
            ) {
                roasVal = parseFloat(d.website_purchase_roas[0].value || "0") || 0;
            }

            totalSpend += spend;
            totalImpressions += impressions;
            totalClicks += clicks;

            if (spend > 0 && roasVal > 0) {
                roasWeightedSum += roasVal * spend;
                roasWeight += spend;
            }

            if (d.date_start && d.date_stop) {
                const start = new Date(d.date_start);
                const stop = new Date(d.date_stop);
                if (!isNaN(start)) {
                    if (!minStart || start < minStart) minStart = start;
                }
                if (!isNaN(stop)) {
                    if (!maxStop || stop > maxStop) maxStop = stop;
                }
            }
        } catch (e) {
            console.warn("Aggregation Insights Fehler für Kampagne:", id, e);
        }
    }

    if (totalSpend === 0 && totalImpressions === 0 && totalClicks === 0) {
        return null;
    }

    const aggSpend = totalSpend;
    const aggCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const aggCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const aggRoas = roasWeight > 0 ? roasWeightedSum / roasWeight : 0;

    let dateStartStr = null;
    let dateStopStr = null;
    if (minStart && maxStop) {
        dateStartStr = minStart.toISOString().slice(0, 10);
        dateStopStr = maxStop.toISOString().slice(0, 10);
    }

    return {
        spend: aggSpend,
        ctr: aggCtr,
        cpm: aggCpm,
        roas: aggRoas,
        impressions: totalImpressions,
        clicks: totalClicks,
        dateStartStr,
        dateStopStr
    };
}

export async function updateDashboardView(connected) {
    if (!connected) {
        renderDashboardKpisPlaceholder();
        renderDashboardChart(null);
        renderDashboardHeroCreatives();
        setDashboardSummary("Noch keine Daten geladen.");
        return;
    }

    try {
        let accountsResult;
        if (AppState.meta.adAccounts?.length) {
            accountsResult = {
                success: true,
                data: { data: AppState.meta.adAccounts }
            };
        } else {
            accountsResult = await fetchMetaAdAccounts();
        }

        if (
            !accountsResult.success ||
            !accountsResult.data ||
            !Array.isArray(accountsResult.data.data) ||
            accountsResult.data.data.length === 0
        ) {
            AppState.dashboardMetrics = {
                spend: 0,
                roas: 0,
                ctr: 0,
                cpm: 0,
                impressions: 0,
                clicks: 0,
                scopeLabel: "Keine Daten",
                timeRangeLabel: "Keine Daten"
            };
            renderDashboardKpisLive(AppState.dashboardMetrics);
            renderDashboardChart(AppState.dashboardMetrics);
            renderDashboardHeroCreatives();
            setDashboardSummary("Kein Ad-Konto gefunden.");
            AppState.dashboardLoaded = true;
            return;
        }

        const accounts = accountsResult.data.data;
        AppState.meta.adAccounts = accounts;

        if (!AppState.selectedAccountId) {
            AppState.selectedAccountId = accounts[0].id;
        }

        const campaignsResult = await fetchMetaCampaigns(AppState.selectedAccountId);

        if (
            !campaignsResult.success ||
            !campaignsResult.data ||
            !Array.isArray(campaignsResult.data.data) ||
            campaignsResult.data.data.length === 0
        ) {
            AppState.meta.campaigns = [];
            AppState.dashboardMetrics = {
                spend: 0,
                roas: 0,
                ctr: 0,
                cpm: 0,
                impressions: 0,
                clicks: 0,
                scopeLabel: "Keine Kampagnen",
                timeRangeLabel: "Keine Daten"
            };
            renderDashboardKpisLive(AppState.dashboardMetrics);
            renderDashboardChart(AppState.dashboardMetrics);
            renderDashboardHeroCreatives();
            setDashboardSummary("Keine Kampagnen im ausgewählten Konto.");
            AppState.dashboardLoaded = true;
            return;
        }

        const campaigns = campaignsResult.data.data;
        AppState.meta.campaigns = campaigns;

        const preset = AppState.timeRangePreset || "last_30d";
        let metrics;

        if (!AppState.selectedCampaignId) {
            const ids = campaigns.map((c) => c.id);
            const agg = await aggregateInsightsForCampaigns(ids, preset);
            if (!agg) {
                metrics = {
                    spend: 0,
                    roas: 0,
                    ctr: 0,
                    cpm: 0,
                    impressions: 0,
                    clicks: 0,
                    scopeLabel: "Keine Insights",
                    timeRangeLabel: "Keine Daten"
                };
            } else {
                metrics = {
                    spend: agg.spend,
                    roas: agg.roas,
                    ctr: agg.ctr,
                    cpm: agg.cpm,
                    impressions: agg.impressions,
                    clicks: agg.clicks,
                    scopeLabel: `Alle Kampagnen (${campaigns.length})`,
                    timeRangeLabel: buildTimeRangeLabel(
                        agg.dateStartStr,
                        agg.dateStopStr
                    )
                };
            }
        } else {
            const insights = await fetchMetaCampaignInsights(
                AppState.selectedCampaignId,
                preset
            );
            if (
                !insights.success ||
                !insights.data ||
                !Array.isArray(insights.data.data) ||
                insights.data.data.length === 0
            ) {
                metrics = {
                    spend: 0,
                    roas: 0,
                    ctr: 0,
                    cpm: 0,
                    impressions: 0,
                    clicks: 0,
                    scopeLabel: "Keine Insights",
                    timeRangeLabel: "Keine Daten"
                };
            } else {
                const d = insights.data.data[0];
                storeCampaignInsightInCache(AppState.selectedCampaignId, d, preset);

                const spend = parseFloat(d.spend || "0") || 0;
                const cpm = parseFloat(d.cpm || "0") || 0;
                const ctr = parseFloat(d.ctr || "0") || 0;
                const impressions = parseFloat(d.impressions || "0") || 0;
                const clicks = parseFloat(d.clicks || "0") || 0;

                let roas = 0;
                if (
                    Array.isArray(d.website_purchase_roas) &&
                    d.website_purchase_roas.length > 0
                ) {
                    roas = parseFloat(d.website_purchase_roas[0].value || "0") || 0;
                }

                const selectedCampaign = campaigns.find(
                    (c) => c.id === AppState.selectedCampaignId
                );

                metrics = {
                    spend,
                    roas,
                    ctr,
                    cpm,
                    impressions,
                    clicks,
                    scopeLabel: selectedCampaign
                        ? selectedCampaign.name
                        : "Ausgewählte Kampagne",
                    timeRangeLabel: buildTimeRangeLabel(d.date_start, d.date_stop)
                };
            }
        }

        AppState.dashboardMetrics = metrics;
        renderDashboardKpisLive(metrics);
        renderDashboardChart(metrics);
        renderDashboardHeroCreatives();
        AppState.dashboardLoaded = true;

        const totalCampaigns = campaigns.length;
        const activeCount = campaigns.filter(
            (c) => (c.status || "").toLowerCase() === "active"
        ).length;
        const pausedCount = campaigns.filter(
            (c) => (c.status || "").toLowerCase() === "paused"
        ).length;

        setDashboardSummary(
            `Kampagnen: ${totalCampaigns} gesamt • Aktiv: ${activeCount} • Pausiert: ${pausedCount}`
        );
    } catch (e) {
        console.error("updateDashboardView error:", e);
        AppState.dashboardMetrics = {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            impressions: 0,
            clicks: 0,
            scopeLabel: "Fehler",
            timeRangeLabel: "Fehler"
        };
        renderDashboardKpisLive(AppState.dashboardMetrics);
        renderDashboardChart(AppState.dashboardMetrics);
        renderDashboardHeroCreatives();
        setDashboardSummary("Fehler beim Laden der Dashboard-Daten.");
        AppState.dashboardLoaded = true;
    }
}
