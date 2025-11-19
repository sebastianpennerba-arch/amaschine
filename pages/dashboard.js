import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, DollarSign, MousePointer, ShoppingCart, Zap } from 'lucide-react';

const AdStreamDashboard = () => {
  const [metaToken, setMetaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [period, setPeriod] = useState('24h');
  const [kpiData, setKpiData] = useState(null);
  const [creatives, setCreatives] = useState([]);
  const [filter, setFilter] = useState('all');

  // Check for stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem('meta_access_token');
    if (stored) {
      setMetaToken(stored);
      loadAccounts(stored);
    }
  }, []);

  // Listen for OAuth callback
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('Message received:', event.data);
      
      if (event.data.type === 'meta-auth-success' && event.data.accessToken) {
        const token = event.data.accessToken;
        setMetaToken(token);
        localStorage.setItem('meta_access_token', token);
        loadAccounts(token);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connectMeta = () => {
    const appId = '732040642590155';
    const redirectUri = 'https://amaschine.vercel.app/api/meta-auth';
    const scope = 'ads_management,ads_read,business_management';
    
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    
    const w = 600, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    
    window.open(authUrl, 'Meta Login', `width=${w},height=${h},left=${left},top=${top}`);
  };

  const loadAccounts = async (token) => {
    setLoading(true);
    try {
      const res = await fetch('/api/meta-adaccounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      console.log('Accounts:', data);
      
      if (data.data && data.data.length > 0) {
        setAccounts(data.data);
        // Auto-select first account
        const firstAccount = data.data[0];
        setSelectedAccount(firstAccount);
        loadCampaigns(token, firstAccount.account_id || firstAccount.id.replace('act_', ''));
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async (token, accountId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/meta-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, accountId })
      });
      const data = await res.json();
      console.log('Campaigns:', data);
      
      if (data.data && data.data.length > 0) {
        setCampaigns(data.data);
        setSelectedCampaign(data.data[0]);
        loadInsights(token, accountId, data.data[0].id);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async (token, accountId, campaignId) => {
    setLoading(true);
    try {
      const preset = period === '7d' ? 'last_7d' : 'yesterday';
      
      const res = await fetch('/api/meta-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, accountId, preset })
      });
      const data = await res.json();
      console.log('Insights:', data);
      
      if (data.data && data.data[0]) {
        const row = data.data[0];
        setKpiData(mapInsights(row));
      }
      
      // Load creatives
      if (campaignId) {
        loadCreatives(token, campaignId);
      }
    } catch (err) {
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCreatives = async (token, campaignId) => {
    try {
      const res = await fetch('/api/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, campaignId })
      });
      const data = await res.json();
      console.log('Ads:', data);
      
      if (data.data) {
        const mapped = data.data.map(ad => {
          const creative = ad.creative || {};
          const thumb = creative.thumbnail_url || creative.image_url || creative.video_url || '';
          const isVideo = thumb.toLowerCase().includes('.mp4');
          
          return {
            id: ad.id,
            name: ad.name || 'Creative',
            url: thumb,
            mediaType: isVideo ? 'video' : 'image',
            ctr: kpiData?.ctr || 0,
            cpc: kpiData?.cpc || 0,
            roas: kpiData?.roas || 0
          };
        });
        setCreatives(mapped);
      }
    } catch (err) {
      console.error('Error loading creatives:', err);
    }
  };

  const mapInsights = (row) => {
    const imp = +row.impressions || 0;
    const clicks = +row.clicks || 0;
    const spend = +row.spend || 0;
    const ctr = parseFloat(row.ctr || 0);
    const cpc = parseFloat(row.cpc || 0);

    let purchases = 0;
    let revenue = 0;

    if (Array.isArray(row.actions)) {
      const p = row.actions.find(a => a.action_type?.includes('purchase'));
      if (p) purchases = +p.value || 0;
    }

    if (Array.isArray(row.action_values)) {
      const v = row.action_values.find(a => a.action_type?.includes('purchase'));
      if (v) revenue = +v.value || 0;
    }

    const roas = spend > 0 ? revenue / spend : 0;
    const aov = purchases > 0 ? revenue / purchases : 0;
    const cr = clicks > 0 ? (purchases / clicks) * 100 : 0;

    return {
      impressions: imp,
      clicks: clicks,
      purchases: purchases,
      revenue: revenue,
      spend: spend,
      roas: roas,
      ctr: ctr,
      cpc: cpc,
      aov: aov,
      cr: cr
    };
  };

  const fmt = {
    num: (v, d = 0) => Number(v || 0).toLocaleString('de-DE', { 
      minimumFractionDigits: d, 
      maximumFractionDigits: d 
    }),
    curr: (v) => Number(v || 0).toLocaleString('de-DE', { 
      style: 'currency', 
      currency: 'EUR' 
    }),
    pct: (v) => (Number(v || 0)).toFixed(2) + ' %'
  };

  const filteredCreatives = creatives.filter(c => {
    if (filter === 'all') return true;
    return c.mediaType === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Activity className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold">AdStream Analytics</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('de-DE', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
            
            {!metaToken ? (
              <button 
                onClick={connectMeta}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Mit Meta verbinden
              </button>
            ) : (
              <span className="text-green-600 font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Meta verbunden
              </span>
            )}
          </div>
        </div>

        {/* Account & Campaign Selection */}
        {metaToken && accounts.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Werbekonto
                </label>
                <select 
                  value={selectedAccount?.id || ''}
                  onChange={(e) => {
                    const acc = accounts.find(a => a.id === e.target.value);
                    setSelectedAccount(acc);
                    loadCampaigns(metaToken, acc.account_id || acc.id.replace('act_', ''));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name || acc.account_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kampagne
                </label>
                <select 
                  value={selectedCampaign?.id || ''}
                  onChange={(e) => {
                    const camp = campaigns.find(c => c.id === e.target.value);
                    setSelectedCampaign(camp);
                    loadInsights(metaToken, selectedAccount.account_id || selectedAccount.id.replace('act_', ''), camp.id);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={campaigns.length === 0}
                >
                  {campaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Period Toggle */}
        {metaToken && (
          <div className="flex gap-3 mb-6">
            <button 
              onClick={() => {
                setPeriod('24h');
                if (selectedAccount && selectedCampaign) {
                  loadInsights(metaToken, selectedAccount.account_id || selectedAccount.id.replace('act_', ''), selectedCampaign.id);
                }
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                period === '24h' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Letzte 24h
            </button>
            <button 
              onClick={() => {
                setPeriod('7d');
                if (selectedAccount && selectedCampaign) {
                  loadInsights(metaToken, selectedAccount.account_id || selectedAccount.id.replace('act_', ''), selectedCampaign.id);
                }
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                period === '7d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Letzte 7 Tage
            </button>
          </div>
        )}

        {/* KPI Overview */}
        {kpiData && (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-xl font-bold">User Journey Überblick</h2>
                  <p className="text-sm text-gray-600">Wichtigste Metriken auf einen Blick</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard icon={<Activity />} label="Impressions" value={fmt.num(kpiData.impressions)} />
                <MetricCard icon={<MousePointer />} label="Clicks" value={fmt.num(kpiData.clicks)} />
                <MetricCard icon={<ShoppingCart />} label="Purchases" value={fmt.num(kpiData.purchases)} />
                <MetricCard icon={<DollarSign />} label="Revenue" value={fmt.curr(kpiData.revenue)} />
                <MetricCard icon={<DollarSign />} label="Spend" value={fmt.curr(kpiData.spend)} />
                <MetricCard icon={<TrendingUp />} label="ROAS" value={fmt.num(kpiData.roas, 2)} color="green" />
                <MetricCard icon={<Zap />} label="CTR" value={fmt.pct(kpiData.ctr)} />
                <MetricCard icon={<DollarSign />} label="CPC" value={fmt.curr(kpiData.cpc)} />
              </div>
            </div>

            {/* Creatives */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-xl font-bold">Active Creatives</h2>
                  <p className="text-sm text-gray-600">Alle Creatives der Kampagne</p>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                {['all', 'image', 'video'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg font-semibold transition capitalize ${
                      filter === f 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    {f === 'all' ? 'Alle' : f === 'image' ? 'Bilder' : 'Videos'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredCreatives.map(creative => (
                  <div key={creative.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {creative.mediaType === 'video' ? (
                      <video src={creative.url} className="w-full h-48 object-cover rounded-lg mb-3" controls />
                    ) : (
                      <img src={creative.url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                           className="w-full h-48 object-cover rounded-lg mb-3" 
                           alt={creative.name} />
                    )}
                    <h3 className="font-semibold text-sm mb-2">{creative.name}</h3>
                    <div className="flex gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        creative.roas >= 3 ? 'bg-green-100 text-green-800' : 
                        creative.roas >= 1.5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        ROAS: {fmt.num(creative.roas, 2)}
                      </span>
                      <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded">
                        CTR: {fmt.num(creative.ctr, 2)}%
                      </span>
                      <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded">
                        CPC: {fmt.curr(creative.cpc)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCreatives.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Keine Creatives gefunden
                </div>
              )}
            </div>
          </>
        )}

        {!metaToken && (
          <div className="text-center py-20">
            <Activity className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Verbinde dein Meta Werbekonto
            </h2>
            <p className="text-gray-600 mb-6">
              Klicke auf "Mit Meta verbinden" um deine Analytics zu laden
            </p>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, color = 'blue' }) => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
    <div className={`text-${color}-600 mb-2`}>{icon}</div>
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
);

export default AdStreamDashboard;
