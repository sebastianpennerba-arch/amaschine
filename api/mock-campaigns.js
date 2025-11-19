export default function handler(req, res) {
  res.status(200).json({
    data: [
      { id: "cmp1", name: "Brand Awareness – Broad" },
      { id: "cmp2", name: "Creative Testing – Hooks" },
      { id: "cmp3", name: "Retargeting – UGC" }
    ]
  });
}
