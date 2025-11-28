// packages/sensei/index.js
// Public API für das Sensei Strategy Center (P4)

import { buildSenseiPayload, normalizeSenseiResult } from "./sensei.compute.js";
import { runSenseiDemo } from "./sensei.demo.js";
import { runSenseiLive } from "./sensei.live.js";
import { renderSenseiOutput } from "./sensei.render.js";

const SenseiPackage = {
    init() {
        console.debug("[SenseiPackage] init()");
        this._attachMainButton();
    },

    async render(options = {}) {
        // nothing to render until user presses button
        // but we could later pre-render last state
    },

    async update(options = {}) {
        // no auto-update needed atm — Sensei only runs on button click
        return;
    },

    destroy() {
        console.debug("[SenseiPackage] destroy()");
    },

    _attachMainButton() {
        const btn = document.getElementById("runSenseiBtn");
        const out = document.getElementById("senseiOutput");
        const loading = document.getElementById("senseiLoading");

        if (!btn || !out || !loading) return;

        btn.onclick = async () => {
            loading.classList.remove("hidden");
            out.classList.add("hidden");
            out.innerHTML = "";

            try {
                const payload = buildSenseiPayload();
                let result;

                if (payload.mode === "demo") {
                    await new Promise((r) => setTimeout(r, 800));
                    result = runSenseiDemo();
                } else {
                    result = await runSenseiLive(payload);
                }

                loading.classList.add("hidden");
                out.classList.remove("hidden");
                out.innerHTML = renderSenseiOutput(result);
            } catch (err) {
                loading.classList.add("hidden");
                out.classList.remove("hidden");
                out.innerHTML = `
                    <div class="sensei-section">
                        <h3>Fehler</h3>
                        <p style="color:var(--danger);">
                            Sensei konnte die Analyse nicht abschließen.
                        </p>
                    </div>
                `;
            }
        };
    }
};

Object.freeze(SenseiPackage);
export default SenseiPackage;
