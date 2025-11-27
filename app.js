/* ============================================
   SIGNALONE.P1 — ORIGINAL APP LOGIK (24.11.2025)
   ============================================ */

/* ========== TOPBAR CLOCK + GREETING ========== */
function updateClock() {
    const now = new Date();
    const date = now.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    const time = now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
    });

    document.getElementById("dateText").textContent = date;
    document.getElementById("clockText").textContent = time;
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Guten Abend!";

    if (hour < 11) greeting = "Guten Morgen!";
    else if (hour < 17) greeting = "Guten Tag!";

    document.getElementById("greetingText").textContent = greeting;
}

setInterval(updateClock, 1000);
updateClock();
updateGreeting();

/* ========== VIEW HANDLING ========== */

const views = document.querySelectorAll(".view");
const menuItems = document.querySelectorAll(".menu-item");

function showView(id) {
    views.forEach(v => v.classList.add("hidden"));
    const target = document.getElementById(id);
    if (target) target.classList.remove("hidden");

    menuItems.forEach(item => item.classList.remove("active"));
    const activeItem = document.querySelector(`[data-view="${id}"]`);
    if (activeItem) activeItem.classList.add("active");
}

menuItems.forEach(item => {
    item.addEventListener("click", e => {
        e.preventDefault();
        const view = item.getAttribute("data-view");
        if (view) showView(view);
    });
});

/* Default View */
showView("dashboardView");

/* ========== META CONNECT STRIPE ========== */
let metaConnected = true; // Deine Original-UI zeigte "Verbunden"

const metaStripe = document.getElementById("metaStripe");
const topbarMetaStatus = document.getElementById("topbarMetaStatus");

function updateMetaStatus() {
    if (metaConnected) {
        metaStripe.classList.add("hidden");
        topbarMetaStatus.classList.remove("meta-status-disconnected");
        topbarMetaStatus.classList.add("meta-status-connected");
        topbarMetaStatus.textContent = "🔌 Meta: Verbunden";
    } else {
        metaStripe.classList.remove("hidden");
        topbarMetaStatus.classList.remove("meta-status-connected");
        topbarMetaStatus.classList.add("meta-status-disconnected");
        topbarMetaStatus.textContent = "🔌 Meta: Getrennt";
    }
}

updateMetaStatus();

/* Optional: Simulierter Connect Button */
const connectMetaBtn = document.getElementById("connectMetaBtn");
if (connectMetaBtn) {
    connectMetaBtn.addEventListener("click", () => {
        metaConnected = true;
        updateMetaStatus();
    });
}

/* ========== KPI UPDATE PLACEHOLDERS ========== */
function updateKpis(data = {}) {
    document.getElementById("kpiSpend").textContent = data.spend || "€ 0,00";
    document.getElementById("kpiRoas").textContent = data.roas || "0x";
    document.getElementById("kpiCtr").textContent = data.ctr || "0.00%";
    document.getElementById("kpiCpm").textContent = data.cpm || "€ 0,00";
}

/* ========== CHART PLACEHOLDER ========== */
function initChart() {
    const canvas = document.getElementById("performanceChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ddd";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

initChart();

/* ========== SELECT DROPDOWNS (STATIC) ========== */
document.getElementById("accountSelector").innerHTML = `
    <option>Projekt_KI_Automation</option>
    <option>SignalOne.cloud</option>
`;

document.getElementById("campaignSelector").innerHTML = `
    <option>SignalOne.cloud</option>
`;

/* ========== TIME RANGE (STATIC) ========== */
document.getElementById("timeRangeSelect").addEventListener("change", () => {
    // Placeholder – Original P1 hatte noch keine Logik
});
