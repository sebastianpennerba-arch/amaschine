export default async function handler(req, res) {
  const { token } = JSON.parse(req.body);

  const url = `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,currency&access_token=${token}`;

  const r = await fetch(url);
  const data = await r.json();

  res.status(200).json(data);
}
