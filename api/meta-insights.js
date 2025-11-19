export default async function handler(req, res) {
  const { token, accountId } = JSON.parse(req.body);

  const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights` +
    `?fields=impressions,clicks,spend,ctr,cpc,roas,actions` +
    `&date_preset=yesterday`;

  const apiRes = await fetch(url + `&access_token=${token}`);
  const data = await apiRes.json();

  res.status(200).json(data);
}
