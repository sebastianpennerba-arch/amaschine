// packages/campaigns/campaigns.compute.js
// Berechnungs- & Format-Helfer für Campaigns

import { AppState } from "../../state.js";

export function formatMoney(val) {
    if (val == null || isNaN(val)) return "-";
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    }).format(val || 0);
}

export function formatInteger(val) {
    if (val == null || isNaN(val)) return "-";
    return new Intl.NumberFormat("de-DE").format(val || 0);
}

export function formatPercent(val) {
    if (val == null || isNaN(val)) return "-";
    return `${Number(val).toFixed(2)}%`;
}

export function formatRoas(val) {
    if (val == null || isNaN(val)) return "-";
    return `${Number(val).toFixed(2)}x`;
}

export function getCampaignInsights(campaign) {
    if (!campaign || !campaign.id) return {};
    const map = AppState.meta?.insightsByCampaign || {};
    const raw = map[campaign.id] || {};

    const spend =
        raw.spend_30d ??
        raw.spend ??
        raw.spend_value ??
        raw.spend_eur ??
        null;

    const roas =
        raw.roas_30d ??
        raw.roas ??
        raw.purchase_roas ??
        null;

    const ctr = raw.ctr_30d ?? raw.ctr ?? null;
    const impressions = raw.impressions_30d ?? raw.impressions ?? null;

    return {
        spend,
        roas,
        ctr,
        impressions
    };
}

export function getStatusLabel(campaign) {
    const status = campaign.status || campaign.effective_status || "UNKNOWN";
    switch (status) {
        case "ACTIVE":
            return { label: "Aktiv", className: "status-pill active" };
        case "PAUSED":
            return { label: "Pausiert", className: "status-pill paused" };
        case "DELETED":
            return { label: "Gelöscht", className: "status-pill deleted" };
        default:
            return { label: status, className: "status-pill unknown" };
    }
}

export function sortCampaignsBySpend(campaigns) {
    const list = Array.isArray(campaigns) ? campaigns : [];
    return [...list].sort((a, b) => {
        const ia = getCampaignInsights(a).spend || 0;
        const ib = getCampaignInsights(b).spend || 0;
        return ib - ia;
    });
}

export function buildSenseiCampaignInsight(campaign, insights) {
    const roas = Number(insights.roas ?? 0);
    const ctr = Number(insights.ctr ?? 0);
    const spend = Number(insights.spend ?? 0);

    if (!spend) {
        return "Noch zu wenig Daten, um eine sinnvolle Empfehlung zu geben. Lass die Kampagne etwas länger laufen oder erhöhe das Budget.";
    }

    if (roas >= 4 && ctr >= 3) {
        return "Top Performer: Diese Kampagne gehört zu deinen stärksten Setups. Sensei Empfehlung: Budget schrittweise (+20–30 %) erhöhen, solange ROAS stabil über 4x bleibt.";
    }

    if (roas >= 2 && ctr >= 2) {
        return "Solide Performance. Nutze die Kampagne als Benchmark und teste neue Creatives innerhalb dieses Setups, um weitere Winner zu finden.";
    }

    if (roas < 1.5 && ctr < 1.5) {
        return "Warnsignal: ROAS und CTR sind niedrig. Sensei Empfehlung: Budget begrenzen, schwache Creatives pausieren und einen strukturierten Hook- oder Offer-Test starten.";
    }

    if (roas < 1.5 && ctr >= 2) {
        return "CTR ist okay, aber ROAS zieht nicht nach. Angebot, Pricing oder Funnel nach dem Klick prüfen – die Anzeige holt die Leute rein, aber sie konvertieren nicht.";
    }

    return "Gemischtes Bild. Behalte die Kampagne im Auge und nutze sie vor allem als Test-Bühne für neue Creatives und Hooks.";
}
