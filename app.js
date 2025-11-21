// SignalOne.cloud - MINIMAL JS CORE (V2)

"use strict";

// Verhindert das Standardverhalten von Links, die auf # zeigen
function setupNavigation() {
    document.querySelectorAll('.menu-item, .system-actions-area button').forEach(item => {
        item.addEventListener('click', (e) => {
            // Verhindert den Sprung der Seite
            e.preventDefault(); 
            // Hier kommt später die Logik für View-Wechsel und Button-Funktionen
            console.log(`Funktion für ${item.textContent.trim()} wird ausgeführt.`);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
});
