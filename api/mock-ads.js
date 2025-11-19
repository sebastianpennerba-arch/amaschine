export default function handler(req, res) {
  res.status(200).json({
    creatives: [
      {
        id: "cr1",
        name: "UGC Hook #1",
        creative: {
          thumbnail_url: "https://placehold.co/400x600",
        },
      },
      {
        id: "cr2",
        name: "Problem Solver Video",
        creative: {
          thumbnail_url: "https://placehold.co/400x600?text=Video",
        },
      },
    ],
  });
}
