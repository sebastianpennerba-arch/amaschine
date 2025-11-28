// core/modal.js
// Reusable modal control for the whole app.
// Aktuell nur API-Skelett, die echte Logik steckt noch in app.js.

const Modal = {
    open(title = "", bodyHtml = "") {
        // Die konkrete Umsetzung bleibt vorerst in app.js.
        // Wir migrieren den Code später hierher.
        console.debug("[Modal] open()", { title, bodyHtml });
    },

    close() {
        console.debug("[Modal] close()");
    }
};

export default Modal;
