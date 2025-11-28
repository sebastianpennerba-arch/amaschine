// packages/reports/reports.pdf.js
// PDF Export – Platzhalter, der eine einfache HTML/Text-Repräsentation als PDF-ähnlichen Blob ausgibt.
// Echte PDF-Erzeugung könntest du später z.B. mit jsPDF implementieren.

export function buildPdfReport(scope, payload) {
    const header = `SignalOne Report (${scope})\n\n`;
    const body = JSON.stringify(payload, null, 2);
    const text = header + body;

    // Kein echtes PDF, aber als Text/PDF-MIME-Type downloadbar.
    return new Blob([text], { type: "application/pdf" });
}
