export default function handler(req, res) {
  res.status(200).json({
    creatives: [
      {
        id: "cr1",
        name: "UGC Hook #1",
        URL: "https://placehold.co/600x800",
        mediaType: "image",
        CTR: 1.9,
        CPC: 0.42,
        ROAS: 2.8
      },
      {
        id: "cr2",
        name: "UGC Video – Problem Solver",
        URL: "https://placehold.co/600x800",
        mediaType: "video",
        CTR: 2.3,
        CPC: 0.38,
        ROAS: 3.4
      }
    ]
  });
}
