export default function handler(req, res) {
  res.status(200).json({
    accounts: [
      {
        id: "999999999",
        name: "Mock Werbekonto"
      }
    ]
  });
}
