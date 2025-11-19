function showLogin() {
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("dashboard-screen").style.display = "none";
}

function showDashboard() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("dashboard-screen").style.display = "block";

  // Dashboard-Daten laden (Dummy + Meta)
  if (typeof loadDashboard === "function") {
    loadDashboard();
  }
}

// Meta Token vom OAuth-Popup empfangen
window.addEventListener("message", async (event) => {
  if (event.data.access_token) {
    const token = event.data.access_token;

    await Clerk.updateUser({
      unsafeMetadata: {
        meta_token: token,
      },
    });

    const status = document.getElementById("metaStatus");
    if (status) status.textContent = "Meta verbunden – bitte Dashboard neu laden";

    alert("Meta Konto verbunden!");

    if (typeof loadMetaData === "function") {
      loadMetaData().catch((err) =>
        console.error("Fehler beim erneuten Laden der Meta-Daten:", err)
      );
    }
  }
});
