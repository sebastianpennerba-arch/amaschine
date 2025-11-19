function showLogin() {
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("dashboard-screen").style.display = "none";
}

function showDashboard() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("dashboard-screen").style.display = "block";
}
window.addEventListener("message", async (event) => {
  if (event.data.access_token) {
    const token = event.data.access_token;

    await Clerk.updateUser({
      unsafeMetadata: {
        meta_token: token
      }
    });

    alert("Meta Konto verbunden!");
  }
});


