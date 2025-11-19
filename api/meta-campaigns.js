export default async function handler(req, res) {
  const { token, accountId } = JSON.parse(req.body);

  const url =
    `https://graph.facebook.com/v19.0/act_${accountId}/campaigns?` +
    `fields=id,name,status,objective&access_token=${token}`;

  const r = await fetch(url);
  const data = await r.json();

  res.status(200).json(data);
}
