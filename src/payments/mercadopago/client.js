// Mercado Pago REST client
import { env, validateEnv } from '../../lib/env';

validateEnv();

const BASE_URL = 'https://api.mercadopago.com';

function logRequest(method, path, status, latency) {
  console.log(`[MP] ${method} ${path} - ${status} (${latency}ms)`);
}

async function mpRequest(method, path, body = null, extraHeaders = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Authorization': `Bearer ${env.mpAccessToken}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const start = Date.now();
  const opts = {
    method,
    headers,
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const latency = Date.now() - start;
  logRequest(method, path, res.status, latency);
  const data = await res.json();
  if (env.mpUseSandbox) data.sandbox = true;
  return data;
}

export const mpGet = (path, extraHeaders) => mpRequest('GET', path, null, extraHeaders);
export const mpPost = (path, body, extraHeaders) => mpRequest('POST', path, body, extraHeaders);
export const mpPut = (path, body, extraHeaders) => mpRequest('PUT', path, body, extraHeaders);
