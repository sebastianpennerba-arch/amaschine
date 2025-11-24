// sensei-api.js – Beispiel Sensei Backend (Node + Express)

import express from "express";
import fetch from "node-fetch"; // bei Node 18+ kannst du auch global fetch nutzen
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Hilfsfunktion: OpenAI Chat-Completion aufrufen
async function callOpenAIChat(messages) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages,
            temperature: 0.4
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            "OpenAI API Fehler: " + res.status + " – " + text
        );
    }

    const json = await res.json();
    const content =
        json.choices?.[0]?.message?.content?.trim() || "";

    return content;
}

// Erwartet Payload so wie aus sensei.js buildSenseiPayloadFromAppState()
app.post("/api/sensei/analyze", async (req, res) => {
    try {
        if (!OPENAI_API_KEY) {
            return res.status(500).json({
                error: "OPENAI_API_KEY nicht gesetzt"
            });
        }

        const {
            mode,
            account,
            dashboard,
            campaigns,
            creatives,
            alerts,
            testing,
            funnel
        } = req.body || {};

        const systemPrompt = `
Du bist SIGNALONE SENSEI, ein extrem spezialisierter Performance-Marketing-Experte für Meta Ads.
Du sprichst DEUTSCH.
Du analysierst Konten, Kampagnen, Creatives und Funnel-Daten.

Deine Antworten sollen IMMER als JSON im folgenden Format kommen:

{
  "summary": "kurze Zusammenfassung",
  "actions": [
    { "title": "...", "message": "...", "priority": "Hoch|Mittel|Niedrig" }
  ],
  "risks": [
    { "title": "...", "message": "...", "priority": "Hoch|Mittel|Niedrig" }
  ],
  "opportunities": [
    { "title": "...", "message": "...", "priority": "Hoch|Mittel|Niedrig" }
  ],
  "testing": [
    { "title": "...", "status": "...", "findings": "...", "next": "...", "priority": "Hoch|Mittel|Niedrig" }
  ],
  "forecast": {
    "spend": Zahl,
    "revenue": Zahl,
    "roas": Zahl,
    "confidence": Zahl zwischen 0 und 1,
    "message": "kurze Erklärung"
  },
  "funnel": {
    "tof": { "score": Zahl, "issues": [String], "opportunities": [String] },
    "mof": { "score": Zahl, "issues": [String], "opportunities": [String] },
    "bof": { "score": Zahl, "issues": [String], "opportunities": [String] }
  }
}

Gib KEINEN Fließtext zurück, NUR dieses JSON.
        `.trim();

        const userContent = {
            mode: mode || "live",
            account,
            dashboard,
            campaigns,
            creatives,
            alerts,
            testing,
            funnel
        };

        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content:
                    "Hier sind die aktuellen Kontodaten als JSON:\n\n" +
                    JSON.stringify(userContent, null, 2)
            }
        ];

        const rawContent = await callOpenAIChat(messages);

        let parsed;
        try {
            // das Modell soll reines JSON liefern
            parsed = JSON.parse(rawContent);
        } catch (e) {
            // Fallback: Modell hat Text + JSON gemischt
            const match = rawContent.match(/\{[\s\S]*\}$/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error(
                    "Konnte JSON aus KI-Antwort nicht parsen."
                );
            }
        }

        return res.json(parsed);
    } catch (err) {
        console.error("Sensei Backend Fehler:", err);
        return res.status(500).json({
            error: "Sensei Analyse fehlgeschlagen.",
            details: err.message
        });
    }
});

// Export oder direkt Starten
// app.listen(3000, () => console.log("Sensei API läuft auf Port 3000"));
export default app;
