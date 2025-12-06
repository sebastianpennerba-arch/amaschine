# SignalOne.cloud - Meta Ads AI Automation Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**SignalOne.cloud** ist eine KI-gestützte Meta Ads Optimierungs-Plattform mit integrierter **Sensei AI Engine** für Creative Testing, Performance Tracking und automatisierte Insights.

---

## 🚀 Features

### ✅ **Sensei AI Engine**
- Creative Performance Scoring (0-100)
- Winner/Loser Detection mit Z-Score Analyse
- Ad Fatigue Detection
- Hook & Story Clustering
- Offer/Funnel Analysis
- Automatische Budget-Shift Recommendations

### ✅ **Meta Ads Integration**
- OAuth 2.0 Authentication Flow
- Ad Accounts, Campaigns, Ads & Creatives Sync
- Insights API (Impressions, Clicks, Spend, ROAS)
- Multi-Account Management

### ✅ **Creative Testing**
- A/B Testing Log mit Winner-Tracking
- Creative Library mit Thumbnails
- Hook-basiertes Clustering
- Creator Performance Insights

### ✅ **Security & Performance**
- XSS Prevention (Input Sanitization)
- Encrypted LocalStorage
- API Response Caching (15min TTL)
- Request Timeouts (30s)
- Rate Limiting (100 req/15min)
- CORS Protection

### ✅ **Dashboard & Analytics**
- Campaign Health Status
- System Status Monitoring
- Real-time KPI Tracking
- Export (CSV, JSON, PDF)

---

## 📁 Projekt-Struktur

signalone-cloud/
├── backend/
│ ├── server.js # Express Server (Fixed)
│ ├── metaRoutes.js # Meta API Proxy (Fixed)
│ ├── senseiRoutes.js # Sensei AI Routes
│ ├── sensei-api.js # Sensei Engine (Refactored)
│ ├── package.json # Dependencies
│ ├── .env.example # Environment Template
│ └── utils/
│ ├── responses.js # Standardized API Responses
│ └── logger.js # Logging Utility
│
├── frontend/
│ ├── index.html # Main HTML (Fixed with CSP)
│ ├── app.js # Core App Logic (Fixed)
│ ├── config.js # Environment Config
│ ├── state.js # App State (Fixed)
│ ├── metaApi.js # Meta API Client (Fixed)
│ ├── styles.css # Main Styles
│ ├── sx-core.css # Core UI System
│ ├── utils/
│ │ ├── sanitize.js # XSS Prevention
│ │ ├── storage.js # Encrypted Storage
│ │ ├── cache.js # API Caching
│ │ └── validators.js # Input Validation
│ └── packages/
│ ├── dashboard/
│ ├── sensei/
│ ├── campaigns/
│ ├── creativeLibrary/
│ └── testingLog/
│
└── README.md # Diese Datei

text

---

## 🛠️ Installation

### **Backend Setup**

cd backend

Install Dependencies
npm install

Configure Environment
cp .env.example .env

Edit .env with your Meta App credentials
Start Development Server
npm run dev

Start Production Server
npm start

text

**Required Environment Variables:**

NODE_ENV=production
PORT=3000
FRONTEND_URL=https://signalone.cloud

META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_OAUTH_REDIRECT_URI=https://signalone.cloud/auth/callback

text

### **Frontend Setup**

cd frontend

Serve with any static server (e.g., Python)
python3 -m http.server 5173

Or use Live Server (VS Code Extension)
Or deploy to Render/Vercel/Netlify
text

**Frontend Configuration:**

Edit `config.js` to set your API endpoints:

API_BASE_URL: 'https://signalone-backend.onrender.com/api'
META_APP_ID: 'your_meta_app_id'

text

---

## 🔐 Security Features

### **Backend**
- ✅ CORS restricted to `FRONTEND_URL`
- ✅ Rate Limiting (100 req / 15min per IP)
- ✅ Request Timeouts (30s)
- ✅ Input Validation on all routes
- ✅ Global Error Handler
- ✅ Environment Variables (no hardcoded secrets)

### **Frontend**
- ✅ XSS Prevention (`sanitizeHtml()` statt `innerHTML`)
- ✅ Encrypted LocalStorage (XOR + Base64)
- ✅ CSP Headers (Content Security Policy)
- ✅ URL Sanitization
- ✅ Access Token Validation
- ✅ API Response Caching mit TTL

---

## 📊 API Endpoints

### **Meta Routes (`/api/meta`)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/oauth/token` | Exchange OAuth code for access token |
| POST | `/me` | Get user profile |
| POST | `/adaccounts` | List ad accounts |
| POST | `/campaigns/:accountId` | List campaigns |
| POST | `/ads/:accountId` | List ads with creatives |
| POST | `/insights/:campaignId` | Get campaign insights |

### **Sensei Routes (`/api/sensei`)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Run AI analysis (creative/offer/hook) |
| GET | `/health` | Health check for Sensei Engine |

**Example Request:**

POST /api/sensei/analyze

{
"mode": "creative",
"creatives": [
{
"id": "123",
"name": "UGC Hook Test",
"metrics": {
"spend": 1200,
"revenue": 4800,
"roas": 4.0,
"ctr": 0.032,
"impressions": 50000,
"clicks": 1600
}
}
]
}

text

---

## 🧪 Testing

### **Backend Tests**

cd backend
npm test # Run all tests
npm run test:watch # Watch mode

text

### **Frontend Tests**

cd frontend

Open in Browser Developer Console:
Run: window.SignalOne.TestingLog.seedDemo()
text

---

## 🚢 Deployment

### **Backend (Render.com)**

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Set Environment Variables
5. Deploy

**Build Command:** `npm install`  
**Start Command:** `npm start`

### **Frontend (Vercel/Netlify)**

1. Push code to GitHub
2. Import project on Vercel/Netlify
3. Set Build Settings:
   - **Build Command:** (none - static site)
   - **Output Directory:** `.`
4. Deploy

---

## 📈 Roadmap

### **v1.1 - Q1 2025**
- [ ] Real Meta Ads OAuth Flow (replace mock)
- [ ] PostgreSQL Database Integration
- [ ] User Authentication & Multi-Tenancy
- [ ] Webhook Events for Auto-Refresh

### **v1.2 - Q2 2025**
- [ ] LLM-basierte Hook-Kategorisierung
- [ ] Predictive ROAS Modeling
- [ ] Automated Budget Shifting
- [ ] Slack/Discord Notifications

### **v2.0 - Q3 2025**
- [ ] Multi-Platform (TikTok Ads, Google Ads)
- [ ] AI Creative Generator
- [ ] White-Label Solution
- [ ] Enterprise Features

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**SignalOne Team**
- Website: [signalone.cloud](https://signalone.cloud)
- GitHub: [@sebastianpennerba-arch](https://github.com/sebastianpennerba-arch)

---

## 🙏 Acknowledgments

- Meta for Ads API
- Express.js Team
- Open Source Community

---

## 📞 Support

Bei Fragen oder Problemen:
- 📧 Email: support@signalone.cloud
- 💬 GitHub Issues: [Create Issue](https://github.com/sebastianpennerba-arch/signalone-backend/issues)

---

**Made with ❤️ and ☕ by SignalOne Team**
