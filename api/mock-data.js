export default function handler(req, res) {
  const creatives = [
    {
      id: "mock1",
      name: "Wellness – 3 Nächte (Massage)",
      mediaType: "image",
      url: "https://amaschine.vercel.app/mock/hd24_wellness_1.png",
      CTR: 2.91,
      CPC: 0.78,
      ROAS: 4.2
    },
    {
      id: "mock2",
      name: "Frühstück – 3 Nächte",
      mediaType: "image",
      url: "https://amaschine.vercel.app/mock/hd24_breakfast.png",
      CTR: 1.72,
      CPC: 1.29,
      ROAS: 2.1
    },
    {
      id: "mock3",
      name: "Pärchenkarte – Wellness",
      mediaType: "image",
      url: "https://amaschine.vercel.app/mock/hd24_couple.png",
      CTR: 3.14,
      CPC: 0.64,
      ROAS: 5.9
    },
    {
      id: "mock4",
      name: "Pool – 59€ Sommerdeal",
      mediaType: "image",
      url: "https://amaschine.vercel.app/mock/hd24_pool.png",
      CTR: 2.42,
      CPC: 0.92,
      ROAS: 3.4
    },
    {
      id: "mock_video1",
      name: "Hoteldealer24 Reel #1",
      mediaType: "video",
      url: "https://amaschine.vercel.app/mock/hd24_video1.mp4",
      CTR: 1.98,
      CPC: 1.10,
      ROAS: 3.1
    }
  ];

  res.status(200).json({
    ok: true,
    creatives
  });
}
