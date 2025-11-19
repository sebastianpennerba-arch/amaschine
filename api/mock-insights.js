export default function handler(req, res) {
  res.status(200).json({
    data: [
      {
        impressions: "152340",
        clicks: "4230",
        ctr: "2.78",
        spend: "98.52",
        actions: [
          { action_type: "purchase", value: "14" }
        ],
        action_values: [
          { action_type: "purchase", value: "362.00" }
        ],
        purchase_roas: [
          { value: "3.67" }
        ]
      }
    ]
  });
}
