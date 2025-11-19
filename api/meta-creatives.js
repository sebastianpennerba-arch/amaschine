export default async function handler(req, res) {
  const { token, adId } = JSON.parse(req.body);

  const url =
    `https://graph.facebook.com/v19.0/${adId}/creatives?fields=thumbnail_url,object_story_spec&access_token=${token}`;

  const r = await fetch(url);
  const data = await r.json();

  res.status(200).json(data);
}
