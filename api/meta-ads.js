export default async function handler(req, res) {
  const { token, campaignId } = JSON.parse(req.body);

  const url =
    `https://graph.facebook.com/v19.0/${campaignId}/ads?` +
    `fields=id,name,creative{object_story_spec,thumbnail_url},status&access_token=${token}`;

  const r = await fetch(url);
  const data = await r.json();

  res.status(200).json(data);
}
