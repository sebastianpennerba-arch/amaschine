export default async function handler(req, res) {
  const { token, accountId } = JSON.parse(req.body);

  const fields = [
    "impressions",
    "clicks",
    "spend",
    "reach",
    "ctr",
    "cpc",
    "conversions",
    "actions",
    "action_values",
    "conversion_values",
    "purchase_roas"
  ].join(",");

  const url =
    `https://graph.facebook.com/v19.0/act_${accountId}/insights?` +
    `fields=${fields}&date_preset=yesterday&access_token=${token}`;

  const r = await fetch(url);
  const data = await r.json();

  res.status(200).json(data);
}
