export async function aggregateFit(token, body) {
  const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Fit ${res.status}`);
  return res.json();
}

const FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.body.read'
].join(' ');

export function getGoogleFitAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'token',
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/fit-auth-callback`,
    scope: FIT_SCOPES,
    include_granted_scopes: 'true',
    state: 'fit_oauth'
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function saveFitToken(token, expiresInSec) {
  const expiry = Date.now() + (Number(expiresInSec || 3600) * 1000) - 30000;
  localStorage.setItem('fit_access_token', token);
  localStorage.setItem('fit_access_token_exp', String(expiry));
}

export function getFitToken() {
  const token = localStorage.getItem('fit_access_token');
  const exp = Number(localStorage.getItem('fit_access_token_exp') || 0);
  if (!token || Date.now() > exp) return null;
  return token;
}


export function disconnectFit() {
  localStorage.removeItem('fit_access_token');
  localStorage.removeItem('fit_access_token_exp');
}

export function last24hRange() {
  const end = Date.now();
  const start = end - 24*60*60*1000;
  return { startTimeMillis: start, endTimeMillis: end };
}
