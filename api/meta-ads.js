// pages/api/meta-ads.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  const { token, campaignId } = body;

  if (!token) {
    return res.status(400).json({ error: "token ist erforderlich" });
  }
  if (!campaignId) {
    return res.status(400).json({ error: "campaignId ist erforderlich" });
  }

  try {
    const fields = [
      "id",
      "name",
      "status",
      "effective_status",
      "creative{thumbnail_url,object_story_spec,image_url,video_url}",
    ].join(",");

    const url =
      `https://graph.facebook.com/v19.0/${campaignId}/ads?` +
      new URLSearchParams({
        fields,
        limit: "200",
        access_token: token,
      }).toString();

    const r = await fetch(url);
    const json = await r.json();

    if (!r.ok) {
      console.error("meta-ads error:", json);
      return res.status(r.status).json({ error: "Meta Error", meta: json });
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("meta-ads server error:", e);
    return res.status(500).json({ error: "Serverfehler in meta-ads" });
  }
}
