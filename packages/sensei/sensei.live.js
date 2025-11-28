// packages/sensei/sensei.live.js
// Live Engine → Backend Anbindung

import { normalizeSenseiResult } from "./sensei.compute.js";

const SENSEI_API_URL =
    "https://signalone-backend.onrender.com/api/sensei/analyze";

export async function runSenseiLive(payload) {
    const res = await fetch(SENSEI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error("API Fehler: " + res.status);
    }

    const data = await res.json();
    return normalizeSenseiResult(data);
}
