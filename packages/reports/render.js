/*
 * Reports Render
 * UI für:
 *  - Report-Übersicht
 *  - Planung wiederkehrender Reports
 *  - Sofort-Generierung eines Demo-Reports
 *
 * State wird in diesem Modul (reportsState) gehalten.
 */

import { scheduleReport, generateReport } from "./compute.js";

const reportsState = {
  items: [],
};

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Report Center";
  container.appendChild(heading);

  const sub = document.createElement("p");
  sub.textContent =
    "Plane automatisierte Reports oder erstelle sofort einen Performance-Report.";
  container.appendChild(sub);

  // Liste der geplanten Reports
  const listSection = document.createElement("section");
  const listTitle = document.createElement("h3");
  listTitle.textContent = "Geplante Reports";
  listSection.appendChild(listTitle);

  const list = document.createElement("ul");
  list.className = "report-list";

  if (!reportsState.items.length) {
    const li = document.createElement("li");
    li.textContent = "Noch keine Reports geplant.";
    list.appendChild(li);
  } else {
    reportsState.items.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = `${labelForType(r.type)} – ${
        r.frequency
      } via ${r.channel}`;
      list.appendChild(li);
    });
  }

  listSection.appendChild(list);

  // Formular zum Planen
  const form = document.createElement("section");
  form.className = "report-form";
  form.innerHTML = `
    <h3>Neuen Report planen</h3>
    <label>
      Typ:
      <select id="report-type">
        <option value="weekly">Weekly Performance</option>
        <option value="monthly">Monthly Performance</option>
        <option value="realtime">Real-Time Alerts</option>
      </select>
    </label>
    <label>
      Frequenz:
      <select id="report-frequency">
        <option value="weekly">Wöchentlich</option>
        <option value="monthly">Monatlich</option>
        <option value="adhoc">Ad-hoc</option>
      </select>
    </label>
    <label>
      Kanal:
      <select id="report-channel">
        <option value="email">E-Mail</option>
        <option value="in-app">In-App</option>
      </select>
    </label>
    <button type="button" id="report-plan-btn">Planen</button>
  `;

  form.querySelector("#report-plan-btn").onclick = () => {
    const type = form.querySelector("#report-type").value;
    const freq = form.querySelector("#report-frequency").value;
    const channel = form.querySelector("#report-channel").value;

    scheduleReport(reportsState.items, type, freq, channel);

    const api = window.SignalOne || {};
    if (typeof api.showToast === "function") {
      api.showToast("Report geplant.", "success");
    }

    render(container, AppState);
  };

  // Sofort-Report
  const instantSection = document.createElement("section");
  instantSection.className = "report-instant";

  const instantBtn = document.createElement("button");
  instantBtn.type = "button";
  instantBtn.textContent = "Report jetzt generieren";
  instantBtn.onclick = () => {
    const reportText = generateReport({
      // hier später echte Daten übergeben
      spend: 47892,
      revenue: 229882,
      roas: 4.8,
      topCreative: "Mia_Hook_Problem_Solution_v3",
    });

    const api = window.SignalOne || {};
    if (typeof api.openSystemModal === "function") {
      api.openSystemModal("Report Vorschau", `<pre>${escapeHtml(
        reportText
      )}</pre>`);
    } else {
      alert(reportText);
    }
  };

  instantSection.appendChild(instantBtn);

  container.appendChild(listSection);
  container.appendChild(form);
  container.appendChild(instantSection);
}

function labelForType(type) {
  switch (type) {
    case "weekly":
      return "Weekly Performance Report";
    case "monthly":
      return "Monthly Performance Report";
    case "realtime":
      return "Real-Time Alert Report";
    default:
      return type;
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
