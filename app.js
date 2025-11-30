document.addEventListener("DOMContentLoaded", () => {
  const views = {
    dashboard: document.getElementById("dashboardView"),
    creatives: document.getElementById("creativesView"),
    campaigns: document.getElementById("campaignsView"),
    testing: document.getElementById("testingView"),
    sensei: document.getElementById("senseiView"),
    onboarding: document.getElementById("onboardingView"),
    roast: document.getElementById("roastView"),
  };

  const navbar = document.getElementById("navbar");
  const topbarDate = document.getElementById("topbarDate");
  const topbarTime = document.getElementById("topbarTime");
  const topbarGreeting = document.getElementById("topbarGreeting");

  const notificationsButton = document.getElementById("notificationsButton");
  const profileButton = document.getElementById("profileButton");
  const logoutButton = document.getElementById("logoutButton");

  const brandSelect = document.getElementById("brandSelect");
  const campaignSelect = document.getElementById("campaignSelect");

  const metaConnectButton = document.getElementById("metaConnectButton");

  const modalOverlay = document.getElementById("modalOverlay");
  const modalClose = document.getElementById("modalClose");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  const toastContainer = document.getElementById("toastContainer");
  const globalLoader = document.getElementById("globalLoader");

  const SIDEBAR_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "icon-dashboard" },
    { id: "creatives", label: "Library", icon: "icon-library" },
    { id: "campaigns", label: "Campaigns", icon: "icon-campaigns" },
    { id: "testing", label: "Testing", icon: "icon-testing" },
    { id: "sensei", label: "Sensei", icon: "icon-sensei" },
    { id: "onboarding", label: "Onboard", icon: "icon-onboarding" },
    { id: "roast", label: "Roast", icon: "icon-roast" },
  ];

  function renderNavbar() {
    navbar.innerHTML = "";
    SIDEBAR_ITEMS.forEach((item) => {
      const li = document.createElement("li");
      li.className = "sidebar-nav-item";
      li.innerHTML = `
        <button class="sidebar-nav-button" data-view="${item.id}">
          <svg class="icon-svg">
            <use href="#${item.icon}"></use>
          </svg>
          <span class="label">${item.label}</span>
        </button>`;
      navbar.appendChild(li);
    });
  }

  function hideAllViews() {
    Object.values(views).forEach((v) => v.classList.remove("active"));
    document
      .querySelectorAll(".sidebar-nav-button")
      .forEach((btn) => btn.classList.remove("active"));
  }

  function showView(id) {
    hideAllViews();
    views[id].classList.add("active");
    document
      .querySelector(`.sidebar-nav-button[data-view="${id}"]`)
      ?.classList.add("active");
  }

  function loadDateTime() {
    const now = new Date();
    topbarDate.textContent = `Datum: ${now.toLocaleDateString("de-DE")}`;
    topbarTime.textContent = `Zeit: ${now.toLocaleTimeString("de-DE")}`;
    requestAnimationFrame(loadDateTime);
  }

  function loadGreeting() {
    const hour = new Date().getHours();
    let g = "Hallo";
    if (hour < 12) g = "Guten Morgen";
    else if (hour < 18) g = "Guten Tag";
    else g = "Guten Abend";
    topbarGreeting.textContent = `${g}, Nutzer!`;
  }

  function showLoader(show = true) {
    if (show) globalLoader.classList.remove("hidden");
    else globalLoader.classList.add("hidden");
  }

  function showToast(msg, type = "success") {
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(() => t.classList.add("visible"), 10);
    setTimeout(() => t.classList.remove("visible"), 3000);
    setTimeout(() => t.remove(), 3500);
  }

  function openModal(title, body) {
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modalOverlay.classList.remove("hidden");
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
  }

  modalClose.onclick = closeModal;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };

  notificationsButton.onclick = () => {
    openModal("Information", "Benachrichtigungen sind derzeit leer.");
  };

  profileButton.onclick = () => {
    openModal("Profil", "Profildaten werden später ergänzt.");
  };

  logoutButton.onclick = () => {
    openModal("Logout", "Logout ist noch nicht implementiert.");
  };
  metaConnectButton.onclick = () => {
    openModal(
      "Meta Ads verbinden",
      "Diese Funktion wird noch implementiert."
    );
  };

  function loadBrands() {
    brandSelect.innerHTML = `<option>Werbekonto auswählen</option>`;
  }

  function loadCampaigns() {
    campaignSelect.innerHTML = `<option>Kampagne auswählen</option>`;
  }

  brandSelect.onchange = () => {
    loadCampaigns();
    showToast("Brand gewechselt", "success");
  };

  campaignSelect.onchange = () => {
    showToast("Kampagne gewechselt", "success");
  };

  function initViews() {
    document.querySelectorAll(".sidebar-nav-button").forEach((btn) => {
      btn.onclick = () => {
        const v = btn.getAttribute("data-view");
        showView(v);
      };
    });
  }

  function init() {
    renderNavbar();
    initViews();
    loadGreeting();
    loadBrands();
    loadCampaigns();
    loadDateTime();
    showView("dashboard");
  }

  init();
});
