// pages/api/meta-campaigns.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  const { token, accountId } = body;

  if (!token) {
    return res.status(400).json({ error: "token ist erforderlich" });
  }

  const accId = accountId || process.env.META_DEFAULT_AD_ACCOUNT;

  try {
    const url =
      `https://graph.facebook.com/v19.0/act_${accId}/campaigns?` +
      new URLSearchParams({
        access_token: token,
        fields: "id,name,status,effective_status",
        limit: "100",
      }).toString();

    const r = await fetch(url);
    const json = await r.json();

    if (!r.ok) {
      console.error("meta-campaigns error:", json);
      return res.status(r.status).json({ error: "Meta Error", meta: json });
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("meta-campaigns server error:", e);
    return res.status(500).json({ error: "Serverfehler in meta-campaigns" });
  }
}
