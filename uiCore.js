// uiCore.js – SignalOne.cloud – FINAL

import { AppState } from "./state.js";

// ----------------------
// Sidebar Active Handling
// ----------------------
export function setActiveSidebarItem(item) {
  document.querySelectorAll(".sidebar-item").forEach((el) => {
    el.classList.remove("active");
  });
  item.classList.add("active");
}

// ----------------------
// Toast System
// ----------------------
const TOAST_LIFETIME = 4000;

export function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.classList.add("toast", `toast-${type}`);
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, TOAST_LIFETIME);
}

// ----------------------
// Modal System
// ----------------------
export function openModal(title, html) {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  const closeBtn = document.getElementById("modalCloseBtn");

  if (!overlay || !titleEl || !bodyEl || !closeBtn) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = html;

  overlay.classList.remove("hidden");

  const handler = () => {
    overlay.classList.add("hidden");
    closeBtn.removeEventListener("click", handler);
    overlay.removeEventListener("click", overlayHandler);
  };

  const overlayHandler = (e) => {
    if (e.target === overlay) {
      handler();
    }
  };

  closeBtn.addEventListener("click", handler);
  overlay.addEventListener("click", overlayHandler);
}

// ----------------------
// Meta Health Indicator Helper (optional)
// ----------------------
export function updateMetaHealthIndicator() {
  const el = document.querySelector(".dot-meta");
  if (!el) return;

  if (AppState.metaConnected) {
    el.classList.add("dot-on");
  } else {
    el.classList.remove("dot-on");
  }
}
