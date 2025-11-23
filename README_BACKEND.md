# SignalOne Backend – Vercel Functions (Meta OAuth)

Dieses Backend stellt den minimalen Server-Layer für Meta OAuth bereit.

## Architektur

- **/api/meta/oauth/token**
  - POST { code, redirectUri }
  - Tauscht OAuth `code` gegen `access_token`
  - Lädt ggf. erste `adAccounts`
  - Antwort: `{ accessToken, expiresIn, tokenType, adAccounts }`

## Setup

1. Repository zu Vercel importieren.
2. In Vercel unter **Settings → Environment Variables**:

   - `META_APP_ID` = deine Facebook App ID  
   - `META_APP_SECRET` = dein Facebook App Secret  
   - `META_OAUTH_REDIRECT_URI` = öffentlich erreichbare URL deiner App  
     (muss mit der Redirect-URL in der Meta App übereinstimmen)

3. Frontend (`app.js`) so konfigurieren, dass:

   ```js
   const META_BACKEND_CONFIG = {
     tokenEndpoint: window.location.origin + "/api/meta/oauth/token"
   };
