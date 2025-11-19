export default async function handler(req, res) {
  const { shortToken } = JSON.parse(req.body);

  const url =
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${process.env.META_APP_ID}&` +
    `client_secret=${process.env.META_APP_SECRET}&` +
    `fb_exchange_token=${shortToken}`;

  const r = await fetch(url);
  const data = await r.json();

  res.status(200).json(data);
}
