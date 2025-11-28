// core/router.js
// Simple view-router skeleton for SignalOne.
// Aktuell nur als Platzhalter, wird später von app.js genutzt.

const Router = {
    currentViewId: "dashboardView",

    /**
     * Switches the visible view section by id.
     * NOTE: Implementation will be wired in a later step.
     */
    showView(viewId) {
        this.currentViewId = viewId;
        // Die eigentliche DOM-Logik bleibt zunächst in app.js
        // und wird später hierher migriert.
    }
};

export default Router;
