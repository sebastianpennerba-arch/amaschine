// viewloader.js

const ViewLoader = {
    async loadView(viewName) {
        const container = document.getElementById("view-container");
        if (!container) return;

        try {
            const html = await fetch(`/views/${viewName}.html`).then(r => r.text());
            container.innerHTML = html;

            if (SignalState.viewModules[viewName]) {
                SignalState.viewModules[viewName]();
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:20px;">⚠️ View '${viewName}' konnte nicht geladen werden.</div>`;
        }
    }
};
