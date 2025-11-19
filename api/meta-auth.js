export default async function handler(req, res) {
  const code = req.query.code;

  const redirectUri = "https://amaschine.vercel.app/api/meta-auth";

  const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
    `client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&client_secret=${process.env.META_APP_SECRET}` +
    `&code=${code}`;

  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();

  // Token speichern zu Clerk User
  // (Client sendet Auth-Request)
  
  const html = `
    <script>
      window.opener.postMessage(${JSON.stringify(tokenData)}, "*");
      window.close();
    </script>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
