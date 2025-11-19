// pages/api/meta-insights.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  const { token, accountId, preset } = body;

  if (!token) {
    return res.status(400).json({ error: "token ist erforderlich" });
  }

  const accId = accountId || process.env.META_DEFAULT_AD_ACCOUNT;
  if (!accId) {
    return res.status(400).json({ error: "accountId oder META_DEFAULT_AD_ACCOUNT fehlt" });
  }

  try {
    const fields = [
      "impressions",
      "clicks",
      "spend",
      "reach",
      "ctr",
      "cpc",
      "actions",
      "action_values",
      "purchase_roas",
    ].join(",");

    const datePreset = preset || "yesterday";

    const url =
      `https://graph.facebook.com/v19.0/act_${accId}/insights?` +
      new URLSearchParams({
        fields,
        date_preset: datePreset,
        access_token: token,
      }).toString();

    const r = await fetch(url);
    const json = await r.json();

    if (!r.ok) {
      console.error("meta-insights error:", json);
      return res.status(r.status).json({ error: "Meta Error", meta: json });
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("meta-insights server error:", e);
    return res.status(500).json({ error: "Serverfehler in meta-insights" });
  }
}
