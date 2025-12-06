// ============================================================
// Meta API Client - Fixed Version
// Added: Caching, Better error handling, Request timeouts
// ============================================================

import ENV from './config.js';
import apiCache from './utils/cache.js';
import { AppState } from './state.js';

const BASE_URL = `${ENV.API_BASE_URL}/meta`;

/**
 * Resolve access token from explicit param or AppState
 */
function resolveAccessToken(explicitToken) {
  if (explicitToken) return explicitToken;
  return AppState?.meta?.accessToken || null;
}

/**
 * Enhanced fetch with timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = ENV.REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  }
}

/**
 * JSON POST wrapper with error handling
 */
async function jsonPost(url, body) {
  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    
    return { res, data };
  } catch (err) {
    console.error('jsonPost error:', err);
    return { 
      res: null, 
      data: { ok: false, error: err.message } 
    };
  }
}

/**
 * 1. Exchange OAuth code for token
 */
export async function exchangeMetaCodeForToken(code, redirectUri) {
  const { res, data } = await jsonPost(`${BASE_URL}/oauth/token`, {
    code,
    redirectUri
  });
  
  if (!res?.ok || !data?.ok || !data.accessToken) {
    console.error('exchangeMetaCodeForToken failed:', data);
    return null;
  }
  
  return data.accessToken;
}

/**
 * 2. Fetch Meta user profile
 */
export async function fetchMetaUser(accessToken) {
  const token = resolveAccessToken(accessToken);
  if (!token) return null;
  
  // Check cache first
  const cacheKey = apiCache.generateKey(`${BASE_URL}/me`, { token });
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log('fetchMetaUser: Using cached data');
    return cached;
  }
  
  const { res, data } = await jsonPost(`${BASE_URL}/me`, {
    accessToken: token
  });
  
  if (!res?.ok || !data?.ok) {
    console.error('fetchMetaUser failed:', data);
    return null;
  }
  
  // Cache response
  apiCache.set(cacheKey, data.data);
  
  return data.data;
}

/**
 * 3. Fetch Meta ad accounts
 */
export async function fetchMetaAdAccounts(accessToken) {
  const token = resolveAccessToken(accessToken);
  if (!token) return [];
  
  // Check cache
  const cacheKey = apiCache.generateKey(`${BASE_URL}/adaccounts`, { token });
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log('fetchMetaAdAccounts: Using cached data');
    return cached;
  }
  
  const { res, data } = await jsonPost(`${BASE_URL}/adaccounts`, {
    accessToken: token
  });
  
  if (!res?.ok || !data?.ok) {
    console.error('fetchMetaAdAccounts failed:', data);
    return [];
  }
  
  const accounts = data.data?.data || [];
  
  // Cache response
  apiCache.set(cacheKey, accounts);
  
  return accounts;
}

/**
 * 4. Fetch campaigns for account
 */
export async function fetchMetaCampaigns(accountId, accessToken) {
  const token = resolveAccessToken(accessToken);
  if (!token || !accountId) return [];
  
  // Check cache
  const cacheKey = apiCache.generateKey(
    `${BASE_URL}/campaigns/${accountId}`,
    { token }
  );
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log('fetchMetaCampaigns: Using cached data');
    return cached;
  }
  
  const { res, data } = await jsonPost(`${BASE_URL}/campaigns/${accountId}`, {
    accessToken: token
  });
  
  if (!res?.ok || !data?.ok) {
    console.error('fetchMetaCampaigns failed:', data);
    return [];
  }
  
  const campaigns = data.data?.data || [];
  
  // Cache response
  apiCache.set(cacheKey, campaigns);
  
  return campaigns;
}

/**
 * 5. Fetch ads for account
 */
export async function fetchMetaAds(accountId, accessToken) {
  const token = resolveAccessToken(accessToken);
  if (!token || !accountId) return [];
  
  // Check cache
  const cacheKey = apiCache.generateKey(
    `${BASE_URL}/ads/${accountId}`,
    { token }
  );
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log('fetchMetaAds: Using cached data');
    return cached;
  }
  
  const { res, data } = await jsonPost(`${BASE_URL}/ads/${accountId}`, {
    accessToken: token
  });
  
  if (!res?.ok || !data?.ok) {
    console.error('fetchMetaAds failed:', data);
    return [];
  }
  
  const ads = data.data?.data || [];
  
  // Cache response
  apiCache.set(cacheKey, ads);
  
  return ads;
}

/**
 * 6. Fetch campaign insights
 */
export async function fetchMetaCampaignInsights(
  campaignId,
  timeRangePreset,
  accessToken
) {
  const token = resolveAccessToken(accessToken);
  
  if (!token || !campaignId) {
    console.error('fetchMetaCampaignInsights: Missing token or campaignId');
    return {
      ok: false,
      success: false,
      error: 'Missing token or campaignId'
    };
  }
  
  const preset = timeRangePreset || AppState.timeRangePreset || 'last_30d';
  
  // Check cache
  const cacheKey = apiCache.generateKey(
    `${BASE_URL}/insights/${campaignId}`,
    { token, preset }
  );
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log('fetchMetaCampaignInsights: Using cached data');
    return {
      ok: true,
      success: true,
      data: cached
    };
  }
  
  const { res, data } = await jsonPost(`${BASE_URL}/insights/${campaignId}`, {
    accessToken: token,
    timeRangePreset: preset
  });
  
  if (!res?.ok || !data) {
    console.error('fetchMetaCampaignInsights HTTP error:', res?.status, data);
    return {
      ok: false,
      success: false,
      error: data?.error || `HTTP ${res?.status}`
    };
  }
  
  const success = !!data.ok;
  
  // Cache successful response
  if (success && data.data) {
    apiCache.set(cacheKey, data.data);
  }
  
  return {
    ...data,
    ok: data.ok,
    success
  };
}

/**
 * Clear all Meta API cache
 */
export function clearMetaCache() {
  apiCache.clearAll();
  console.log('Meta API cache cleared');
}
