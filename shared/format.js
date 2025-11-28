// shared/format.js
// Zentrale Formatierungs-Utilities für Währungen, Prozent, etc.

export function formatCurrency(value, currency = "EUR", locale = "de-DE") {
    if (value == null || isNaN(value)) return "-";
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency
        }).format(Number(value));
    } catch {
        return `${Number(value).toFixed(2)} ${currency}`;
    }
}

export function formatPercent(value, fractionDigits = 1, locale = "de-DE") {
    if (value == null || isNaN(value)) return "-";
    const num = Number(value) / 100;
    try {
        return new Intl.NumberFormat(locale, {
            style: "percent",
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        }).format(num);
    } catch {
        return `${(num * 100).toFixed(fractionDigits)}%`;
    }
}

export function formatNumber(value, fractionDigits = 0, locale = "de-DE") {
    if (value == null || isNaN(value)) return "-";
    try {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        }).format(Number(value));
    } catch {
        return String(value);
    }
}
