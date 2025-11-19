// pages/api/meta-adaccounts.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  const { token } = body;

  if (!token) {
    return res.status(400).json({ error: "token ist erforderlich" });
  }

  try {
    const url =
      "https://graph.facebook.com/v19.0/me/adaccounts?" +
      new URLSearchParams({
        access_token: token,
        fields: "id,account_id,name,account_status",
      }).toString();

    const r = await fetch(url);
    const json = await r.json();

    if (!r.ok) {
      console.error("meta-adaccounts error:", json);
      return res.status(r.status).json({ error: "Meta Error", meta: json });
    }

    // Fallback: Wenn leer, nimm dein Standard-Konto
    if (!json.data || !json.data.length) {
      return res.status(200).json({
        data: [
          {
            id: `act_${process.env.META_DEFAULT_AD_ACCOUNT}`,
            account_id: process.env.META_DEFAULT_AD_ACCOUNT,
            name: "Default Ad Account",
          },
        ],
      });
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("meta-adaccounts server error:", e);
    return res.status(500).json({ error: "Serverfehler in meta-adaccounts" });
  }
}
