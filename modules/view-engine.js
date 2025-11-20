console.log("ViewEngine TEST geladen");

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded OK");

    // Clicks abfangen
    document.querySelectorAll(".menu-item").forEach(item => {
        item.addEventListener("click", () => {
            const view = item.dataset.view;
            console.log("Klick:", view);
            location.hash = view;
        });
    });

    // Hash Loader
    function loadView() {
        const view = location.hash.replace("#", "") || "dashboard";
        console.log("lade View:", view);

        document.getElementById("view-container").innerHTML = `
            <div style="padding:20px;">
                <h2>View geladen: ${view}</h2>
                <p>Testmodus – HTML wird korrekt ersetzt.</p>
            </div>`;
    }

    window.addEventListener("hashchange", loadView);
    loadView();
});
