/* ----------------------------------------------------------
   GLOBAL FORMAT HELPERS
   Muss existieren, sonst crashen alle Module!
-----------------------------------------------------------*/

export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function formatNumber(value, fractionDigits = 0, suffix = "") {
  if (value == null || Number.isNaN(value)) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + suffix
  );
}

export function formatPercent(value, fractionDigits = 2) {
  if (value == null || Number.isNaN(value)) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + " %"
  );
}
