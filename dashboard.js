// dashboard.js – FINAL VERSION (Extended: KPIs + Alerts + Sensei + Performer)

import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";
import { fetchMetaCampaignInsights } from "./metaApi.js";

/**
 * Haupteinstieg aus app.js
 * app.js ruft: updateDashboardView(dataConnected)
 */
export async function updateDashboardView(hasData) {
    const kpiContainer = document.getElementById("dashboardKpiContainer");
    const chartContainer = document.getElementById("dashboardChartContainer");
    const alertsContainer = document.getElementById("dashboardAlertsContainer");
    const briefingContainer = document.getElementById("dashboardSenseiBriefingContainer");
    const topPerfContainer = document.getElementById("dashboardTopPerformersContainer");
    const bottomPerfContainer = document.getElementById("dashboardBottomPerformersContainer");
    const heroCreativesContainer = document.getElementById("dashboardHeroCreativesContainer");
    const metaSummaryEl = document.getElementById("dashboardMetaSummary");

    if (!kpiContainer) return; // Hard-Fail-Schutz

    // Wenn keine Daten (kein Meta + kein Demo)
    if (!hasData) {
        kpiContainer.innerHTML = `
            <div class="card hero-empty">
                <p>Keine Daten geladen. Verbinde Meta Ads oder aktiviere den Demo Mode in den Einstellungen.</p>
            </div>
        `;
        if (chartContainer) chartContainer.innerHTML = "";
        if (alertsContainer) alertsContainer.innerHTML = "";
        if (briefingContainer) briefingContainer.innerHTML = "";
        if (topPerfContainer) topPerfContainer.innerHTML = "";
        if (bottomPerfContainer) bottomPerfContainer.innerHTML = "";
        if (heroCreativesContainer) heroCreativesContainer.innerHTML = "";
        if (metaSummaryEl) {
            metaSummaryEl.textContent =
                "Keine Datenquelle aktiv. Demo Mode: AUS · Meta: nicht verbunden.";
        }
        return;
    }

    const isDemo = !!AppState.settings?.demoMode;
    const campaigns = AppState.meta?.campaigns || [];
    const insightsByCampaign = AppState.meta?.insightsByCampaign || {};
    const selectedCampaignId = AppState.selectedCampaignId;

    // Gefilterte Kampagnen abhängig von Auswahl
    const scopedCampaigns = selectedCampaignId
        ? campaigns.filter((c) => c.id === selectedCampaignId)
        : campaigns;

    if (!scopedCampaigns.length) {
        kpiContainer.innerHTML = `
            <div class="card hero-empty">
                <p>Keine Kampagnen für die aktuelle Auswahl gefunden.</p>
            </div>
        `;
        if (metaSummaryEl) {
            metaSummaryEl.textContent = `Aktives Konto: ${
                AppState.selectedAccountId || "n/a"
            } · 0 Kampagnen in der Auswahl.`;
        }
        return;
    }

    // Live-Modus: fehlende Insights nachladen
    if (!isDemo) {
        try {
            await ensureInsightsForCampaigns(scopedCampaigns);
        } catch (e) {
            console.error("Dashboard insights error:", e);
            showToast("Fehler beim Laden der Insights für das Dashboard.", "error");
        }
    }

    const metrics = aggregateMetrics(scopedCampaigns, AppState.meta.insightsByCampaign);

    // Meta Summary Text
    if (metaSummaryEl) {
        const total = campaigns.length;
        const scoped = scopedCampaigns.length;
        const range = AppState.timeRangePreset || "last_30d";
        const rangeLabel = humanizeTimeRange(range);

        metaSummaryEl.textContent = `${
            isDemo ? "Demo Modus aktiv" : "Live Daten"
        } · Konto: ${AppState.selectedAccountId || "n/a"} · Kampagnen: ${
            scoped
        } / ${total} · Zeitraum: ${rangeLabel}`;
    }

    // KPI Grid
    renderKpis(kpiContainer, metrics);

    // Chart (Placeholder / Mini-View)
    if (chartContainer) {
        renderChart(chartContainer, scopedCampaigns, AppState.meta.insightsByCampaign);
    }

    // Alerts
    if (alertsContainer) {
        renderAlerts(alertsContainer, scopedCampaigns, metrics);
    }

    // Sensei Briefing (Extended)
    if (briefingContainer) {
        renderSenseiBriefing(briefingContainer, scopedCampaigns, metrics);
    }

    // Top Performer (Creatives / Kampagnen)
    if (topPerfContainer) {
        renderTopPerformers(topPerfContainer, scopedCampaigns, AppState.meta.insightsByCampaign);
    }

    // Bottom Performer
    if (bottomPerfContainer) {
        renderBottomPerformers(
            bottomPerfContainer,
            scopedCampaigns,
            AppState.meta.insightsByCampaign
        );
    }

    // Hero Creatives (wenn vorhanden)
    if (heroCreativesContainer) {
        renderHeroCreatives(heroCreativesContainer);
    }

    AppState.dashboardLoaded = true;
}

/* ============================================================
   DATA LOADING – INSIGHTS
============================================================ */

async function ensureInsightsForCampaigns(campaigns) {
    if (!campaigns || !campaigns.length) return;

    const timeRange = AppState.timeRangePreset || "last_30d";
    const missing = campaigns.filter((c) => !AppState.meta.insightsByCampaign?.[c.id]);

    if (!missing.length) return;

    // Limit zur Sicherheit (Performance)
    const toFetch = missing.slice(0, 25);

    const promises = toFetch.map((c) =>
        fetchMetaCampaignInsights(c.id, timeRange)
            .then((res) => {
                if (res && res.ok) {
                    AppState.meta.insightsByCampaign = {
                        ...(AppState.meta.insightsByCampaign || {}),
                        [c.id]: res.data || res.insights || res
                    };
                }
            })
            .catch((e) => console.error("Insight Fetch Error", c.id, e))
    );

    await Promise.all(promises);
}

/* ============================================================
   METRIC AGGREGATION
============================================================ */

function aggregateMetrics(campaigns, insightsByCampaign = {}) {
    let spend = 0;
    let revenue = 0;
    let impressions = 0;
    let clicks = 0;
    let roasSum = 0;
    let roasCount = 0;
    let ctrSum = 0;
    let ctrCount = 0;

    campaigns.forEach((c) => {
        const ins = insightsByCampaign[c.id] || {};
        const s = toNumber(ins.spend ?? ins.spend_total);
        const r = toNumber(ins.revenue ?? ins.purchase_value);
        const imp = toNumber(ins.impressions);
        const clk = toNumber(ins.clicks);
        const roas = s > 0 ? r / s : 0;
        const ctr = imp > 0 ? (clk / imp) * 100 : 0;

        spend += s;
        revenue += r;
        impressions += imp;
        clicks += clk;

        if (roas > 0) {
            roasSum += roas;
            roasCount++;
        }
        if (ctr > 0) {
            ctrSum += ctr;
            ctrCount++;
        }
    });

    const avgRoas = roasCount > 0 ? roasSum / roasCount : 0;
    const avgCtr = ctrCount > 0 ? ctrSum / ctrCount : 0;

    // Dummy-Trends (für jetzt neutral)
    return {
        totalSpend: spend,
        totalRevenue: revenue,
        totalImpressions: impressions,
        totalClicks: clicks,
        avgRoas,
        avgCtr,

        spendTrend: null,
        revenueTrend: null,
        roasTrend: null
    };
}

/* ============================================================
   RENDER: KPIS
============================================================ */

function renderKpis(container, metrics) {
    const { totalSpend, totalRevenue, totalImpressions, totalClicks, avgRoas, avgCtr } =
        metrics;

    container.innerHTML = `
        <div class="card">
            <div class="kpi-grid">

                ${renderKpiCard(
                    "Ad Spend",
                    totalSpend,
                    "€",
                    metrics.spendTrend,
                    "fa-coins",
                    "Gesamtausgaben im Zeitraum"
                )}

                ${renderKpiCard(
                    "Revenue",
                    totalRevenue,
                    "€",
                    metrics.revenueTrend,
                    "fa-sack-dollar",
                    "Umsatz (Purchase Conversion Value)"
                )}

                ${renderKpiCard(
                    "ROAS",
                    avgRoas,
                    "x",
                    metrics.roasTrend,
                    "fa-arrow-trend-up",
                    "Durchschnittlicher Return on Ad Spend"
                )}

                ${renderKpiCard(
                    "Impressions / Clicks",
                    totalImpressions,
                    "",
                    null,
                    "fa-eye",
                    `Clicks: ${formatNumber(totalClicks)}`
                )}
            </div>
        </div>
    `;
}

function renderKpiCard(label, value, suffix, trend, iconClass, subline) {
    const formatted = formatNumber(value, suffix);
    const trendClass =
        trend === null ? "trend-neutral" : trend > 0 ? "trend-positive" : "trend-negative";
    const trendLabel =
        trend === null
            ? "–"
            : `${trend > 0 ? "▲" : "▼"} ${Math.abs(trend).toFixed(1)}% vs. Vormonat`;

    return `
        <div class="kpi-card">
            <div class="kpi-label">
                <i class="fas ${iconClass || "fa-chart-line"}"></i>
                ${label}
            </div>
            <div class="kpi-value">${formatted}</div>
            <div class="kpi-trend ${trendClass}">${trendLabel}</div>
            ${
                subline
                    ? `<div class="kpi-sub">${subline}</div>`
                    : ""
            }
        </div>
    `;
}

/* ============================================================
   RENDER: CHART (SIMPLE PLACEHOLDER)
============================================================ */

function renderChart(container, campaigns, insightsByCampaign) {
    // Für jetzt: einfacher Text/Placeholder – später austauschbar mit echtem Chart
    const topBySpend = [...campaigns]
        .map((c) => {
            const ins = insightsByCampaign[c.id] || {};
            const spend = toNumber(ins.spend ?? ins.spend_total);
            return { id: c.id, name: c.name || c.campaign_name || "Unbenannte Kampagne", spend };
        })
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5);

    container.innerHTML = `
        <div class="card performance-card">
            <div class="card-header">
                <h3>Spend Verteilung (Top Kampagnen)</h3>
                <div class="controls">
                    <span style="font-size:12px; color:var(--text-secondary);">
                        Quick Snapshot – ohne externe Chart-Bibliothek
                    </span>
                </div>
            </div>

            <div class="chart-placeholder">
                ${
                    topBySpend.length === 0
                        ? "Noch keine Spend-Daten vorhanden."
                        : `
                    <div style="width:100%;">
                        ${topBySpend
                            .map((c) => {
                                const width = c.spend <= 0 ? 0 : Math.min(100, (c.spend / topBySpend[0].spend) * 100);
                                return `
                                    <div style="margin-bottom:6px;">
                                        <div style="display:flex; justify-content:space-between; font-size:12px;">
                                            <span>${escapeHtml(c.name)}</span>
                                            <span>${formatNumber(c.spend, "€")}</span>
                                        </div>
                                        <div class="kpi-slider-track">
                                            <div class="kpi-slider-fill fill-spend" style="width:${width}%;"></div>
                                        </div>
                                    </div>
                                `;
                            })
                            .join("")}
                    </div>
                `
                }
            </div>
        </div>
    `;
}

/* ============================================================
   RENDER: ALERTS
============================================================ */

function renderAlerts(container, campaigns, metrics) {
    const { avgRoas, totalSpend } = metrics;

    const alerts = [];

    if (totalSpend > 0 && avgRoas < 1) {
        alerts.push({
            type: "critical",
            title: "ROAS unter 1,0",
            message:
                "Im aktuellen Zeitraum liegt der durchschnittliche ROAS unter 1,0. Prüfe Creatives, Zielgruppen und Bidding.",
            meta: "Kennzahl: ROAS · Zeitraum: " + humanizeTimeRange(AppState.timeRangePreset)
        });
    }

    if (totalSpend > 0 && avgRoas >= 1 && avgRoas < 2) {
        alerts.push({
            type: "warning",
            title: "ROAS im grauen Bereich",
            message:
                "Deine Kampagnen sind nicht katastrophal, aber weit entfernt von erstklassiger Performance. Höchste Zeit für Creative- und Funnel-Tests.",
            meta: "Kennzahl: ROAS 1–2 · Zeitraum: " + humanizeTimeRange(AppState.timeRangePreset)
        });
    }

    const highSpend = campaigns.filter((c) => {
        const ins = AppState.meta.insightsByCampaign?.[c.id] || {};
        const spend = toNumber(ins.spend ?? ins.spend_total);
        const revenue = toNumber(ins.revenue ?? ins.purchase_value);
        const roas = spend > 0 ? revenue / spend : 0;
        return spend > 500 && roas < 1;
    });

    highSpend.slice(0, 3).forEach((c) => {
        const ins = AppState.meta.insightsByCampaign?.[c.id] || {};
        const spend = toNumber(ins.spend ?? ins.spend_total);
        const revenue = toNumber(ins.revenue ?? ins.purchase_value);
        const roas = spend > 0 ? revenue / spend : 0;

        alerts.push({
            type: "critical",
            title: `High-Spend Loser: ${c.name || c.campaign_name || "Unbenannte Kampagne"}`,
            message: `Diese Kampagne verbrennt Budget (Spend: ${formatNumber(
                spend,
                "€"
            )}, ROAS: ${roas ? roas.toFixed(2) + "x" : "–"}).`,
            meta: "Empfehlung: Bidding, Zielgruppen & Creatives überprüfen."
        });
    });

    if (!alerts.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <section class="alerts-section">
            <h3 class="section-title">
                <i class="fas fa-triangle-exclamation"></i>
                Sensei Alerts
            </h3>
            <div class="alerts-grid">
                ${alerts.map(renderAlertCard).join("")}
            </div>
        </section>
    `;
}

function renderAlertCard(alert) {
    const baseClass =
        alert.type === "critical"
            ? "alert-card alert-critical"
            : alert.type === "warning"
            ? "alert-card alert-warning"
            : "alert-card alert-success";

    const icon =
        alert.type === "critical"
            ? "fa-fire"
            : alert.type === "warning"
            ? "fa-circle-exclamation"
            : "fa-circle-check";

    return `
        <div class="${baseClass}">
            <div class="alert-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${escapeHtml(alert.title)}</div>
                <div class="alert-message">${escapeHtml(alert.message)}</div>
                <div class="alert-meta">${escapeHtml(alert.meta || "")}</div>
            </div>
        </div>
    `;
}

/* ============================================================
   RENDER: SENSEI BRIEFING (Extended)
============================================================ */

function renderSenseiBriefing(container, campaigns, metrics) {
    const { avgRoas, totalSpend } = metrics;
    const isDemo = !!AppState.settings?.demoMode;

    const primaryBadge = (() => {
        if (totalSpend === 0) return { level: "info", label: "Kein Spend" };
        if (avgRoas >= 3) return { level: "info", label: "Elite Performance" };
        if (avgRoas >= 1.5) return { level: "warning", label: "Stabil, aber ausbaufähig" };
        if (avgRoas > 0) return { level: "critical", label: "Unter Wasser" };
        return { level: "info", label: "Unklar" };
    })();

    const top = getTopCampaignsByRoas(campaigns, AppState.meta.insightsByCampaign, 3);
    const worst = getBottomCampaignsByRoas(campaigns, AppState.meta.insightsByCampaign, 3);

    container.innerHTML = `
        <section class="sensei-briefing-section">
            <div class="briefing-card">
                <span class="priority-badge ${primaryBadge.level}">
                    ${primaryBadge.label}
                </span>
                <div class="briefing-content">
                    ${
                        totalSpend === 0
                            ? `
                        Es liegen aktuell keine Spend-Daten im gewählten Zeitraum vor.
                        Starte Kampagnen oder ändere den Zeitraum, um ein Briefing zu erhalten.
                    `
                            : avgRoas >= 3
                            ? `
                        Deine Kampagnen liefern aktuell starke Ergebnisse. Fokus jetzt:
                        Skalierung ohne ROAS-Abfall. Nutze strukturiertes Budget-Scaling,
                        Creative-Konzepte mit bewährten Hooks und sauberes Tracking.
                    `
                            : avgRoas >= 1.5
                            ? `
                        Deine Ergebnisse sind okay, aber du verschenkst Potenzial. Du solltest
                        jetzt strukturierte Tests fahren: Angebote, Creatives, Zielgruppen.
                    `
                            : `
                        Deine Accounts laufen unter Wasser. Bevor du weiteres Budget investierst,
                        brauchst du Klarheit über Winning Creatives, Funnels und Zielgruppen.
                    `
                    }
                </div>

                <div class="action-line">
                    > Fokus-Kampagnen (Top): ${
                        top.length ? top.map((c) => c.name).join(", ") : "Keine klaren Gewinner"
                    }
                </div>
                <div class="action-line">
                    > Problem-Kampagnen (Bottom): ${
                        worst.length
                            ? worst.map((c) => c.name).join(", ")
                            : "Keine eindeutig schlechten Kampagnen"
                    }
                </div>

                <div class="action-reason">
                    Dieses Briefing basiert auf aggregierten Kampagnen-Insights des aktuellen
                    Zeitraums (<strong>${humanizeTimeRange(
                        AppState.timeRangePreset
                    )}</strong>). Es dient als Ausgangspunkt
                    für Entscheidungen, ersetzt aber kein strukturiertes Testing-Setup.
                    ${isDemo ? "<br/><br/><em>Hinweis: Demo Mode aktiv.</em>" : ""}
                </div>

                <button class="btn-primary">
                    Nächste Tests im Testing Log planen
                </button>
                <button class="btn-secondary">
                    Creative Library öffnen
                </button>
            </div>
        </section>
    `;
}

/* ============================================================
   RENDER: TOP & BOTTOM PERFORMERS
============================================================ */

function renderTopPerformers(container, campaigns, insightsByCampaign) {
    const ranked = decorateCampaignsWithMetrics(campaigns, insightsByCampaign)
        .filter((c) => c.metrics.spend > 0)
        .sort((a, b) => (b.metrics.roas || 0) - (a.metrics.roas || 0))
        .slice(0, 3);

    if (!ranked.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <section class="top-performers-section">
            <h3 class="section-title">
                <i class="fas fa-trophy"></i> Top Performer Kampagnen
            </h3>
            <div class="top-performers-grid">
                ${ranked.map(renderTopPerformerCard).join("")}
            </div>
        </section>
    `;
}

function renderTopPerformerCard(c) {
    const m = c.metrics;

    return `
        <div class="top-performer-card">
            <div class="performer-rank">#${c.rank}</div>
            <div class="performer-content">
                <div class="performer-name">${escapeHtml(
                    c.name || c.campaign_name || "Unbenannte Kampagne"
                )}</div>
                <div class="performer-metrics">
                    <span class="metric-badge roas">
                        ROAS: ${m.roas ? m.roas.toFixed(2) + "x" : "–"}
                    </span>
                    <span class="metric-badge spend">
                        Spend: ${formatNumber(m.spend, "€")}
                    </span>
                    <span class="metric-badge ctr">
                        CTR: ${m.ctr ? m.ctr.toFixed(2) + "%" : "–"}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function renderBottomPerformers(container, campaigns, insightsByCampaign) {
    const ranked = decorateCampaignsWithMetrics(campaigns, insightsByCampaign)
        .filter((c) => c.metrics.spend > 0)
        .sort((a, b) => (a.metrics.roas || 0) - (b.metrics.roas || 0))
        .slice(0, 3);

    if (!ranked.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <section class="bottom-performers-section">
            <h3 class="section-title danger">
                <i class="fas fa-fire"></i> Underperformer (Achtung)
            </h3>
            <div class="bottom-performers-grid">
                ${ranked.map(renderBottomPerformerCard).join("")}
            </div>
        </section>
    `;
}

function renderBottomPerformerCard(c) {
    const m = c.metrics;

    return `
        <div class="bottom-performer-card">
            <div class="loser-badge">Kandidat für Pausierung</div>
            <div><strong>${escapeHtml(
                c.name || c.campaign_name || "Unbenannte Kampagne"
            )}</strong></div>
            <div class="sensei-recommendation">
                <p>
                    Diese Kampagne liefert einen schwachen ROAS (${m.roas ? m.roas.toFixed(2) + "x" : "–"})
                    bei einem Spend von ${formatNumber(m.spend, "€")}.
                </p>
                <p>
                    Empfehlung: entweder pausieren oder in ein strukturiertes Testing-Setup
                    überführen (neue Creatives, neue Hooks, andere Offer-Struktur).
                </p>
            </div>
            <div class="action-buttons">
                <button class="btn-danger btn-pause-creative">
                    Kampagne in Testing Log markieren
                </button>
            </div>
        </div>
    `;
}

/* ============================================================
   RENDER: HERO CREATIVES (Optional)
============================================================ */

function renderHeroCreatives(container) {
    const creatives = AppState.meta?.creatives || AppState.meta?.ads || [];

    if (!creatives || !creatives.length) {
        container.innerHTML = "";
        return;
    }

    const decorated = creatives
        .map((ad) => {
            const roas = toNumber(ad.roas);
            const spend = toNumber(ad.spend ?? ad.spend_total);
            const revenue = toNumber(ad.revenue ?? ad.purchase_value);
            return {
                ...ad,
                metrics: { roas, spend, revenue }
            };
        })
        .sort((a, b) => (b.metrics.roas || 0) - (a.metrics.roas || 0))
        .slice(0, 3);

    container.innerHTML = `
        <section class="card">
            <h3 class="hero-title">Hero Creatives (Top ROAS)</h3>
            <div class="hero-grid">
                ${decorated
                    .map((c, index) => {
                        const m = c.metrics;
                        const label = c.name || c.ad_name || c.headline || "Unbenannter Creative";

                        return `
                            <article class="creative-hero-item">
                                <div class="creative-media-container">
                                    <div class="creative-faux-thumb">
                                        ${index + 1}
                                    </div>
                                </div>
                                <div class="creative-details">
                                    <div class="creative-name">${escapeHtml(label)}</div>
                                    <div class="creative-kpi-bar">
                                        <span>ROAS: ${
                                            m.roas ? m.roas.toFixed(2) + "x" : "–"
                                        }</span>
                                        <span>Spend: ${formatNumber(m.spend, "€")}</span>
                                    </div>
                                </div>
                            </article>
                        `;
                    })
                    .join("")}
            </div>
        </section>
    `;
}

/* ============================================================
   HELPERS
============================================================ */

function toNumber(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function formatNumber(value, suffix = "") {
    const num = Number(value || 0);
    if (suffix === "€") {
        return num.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0
        });
    }
    if (suffix === "x") {
        return num ? num.toFixed(2) + "x" : "–";
    }
    if (num > 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num > 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString("de-DE");
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function humanizeTimeRange(range) {
    switch (range) {
        case "today":
            return "Heute";
        case "yesterday":
            return "Gestern";
        case "today_yesterday":
            return "Heute + Gestern";
        case "last_7d":
            return "Letzte 7 Tage";
        case "last_30d":
            return "Letzte 30 Tage";
        case "this_month":
            return "Aktueller Monat";
        case "last_month":
            return "Letzter Monat";
        default:
            return "Benutzerdefiniert";
    }
}

function decorateCampaignsWithMetrics(campaigns, insightsByCampaign = {}) {
    return campaigns.map((c, index) => {
        const ins = insightsByCampaign[c.id] || {};
        const spend = toNumber(ins.spend ?? ins.spend_total);
        const revenue = toNumber(ins.revenue ?? ins.purchase_value);
        const impressions = toNumber(ins.impressions);
        const clicks = toNumber(ins.clicks);
        const roas = spend > 0 ? revenue / spend : 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

        return {
            ...c,
            rank: index + 1,
            metrics: { spend, revenue, impressions, clicks, roas, ctr }
        };
    });
}

function getTopCampaignsByRoas(campaigns, insightsByCampaign = {}, limit = 3) {
    return decorateCampaignsWithMetrics(campaigns, insightsByCampaign)
        .filter((c) => c.metrics.spend > 0)
        .sort((a, b) => (b.metrics.roas || 0) - (a.metrics.roas || 0))
        .slice(0, limit);
}

function getBottomCampaignsByRoas(campaigns, insightsByCampaign = {}, limit = 3) {
    return decorateCampaignsWithMetrics(campaigns, insightsByCampaign)
        .filter((c) => c.metrics.spend > 0)
        .sort((a, b) => (a.metrics.roas || 0) - (b.metrics.roas || 0))
        .slice(0, limit);
}
