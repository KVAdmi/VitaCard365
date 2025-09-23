const FIT_API_BASE = import.meta.env.VITE_FIT_URL || import.meta.env.VITE_IVITA_URL;

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }
  return res.json();
}


export function startRun({ user_id, source = 'manual', meta } = {}) {
  return jsonFetch(`${FIT_API_BASE}/fit/runs/start`, {
    method: 'POST',
    body: JSON.stringify({ user_id, source, meta }),
  });
}


export function pushPoint(run_id, point) {
  return jsonFetch(`${FIT_API_BASE}/fit/runs/${run_id}/point`, {
    method: 'POST',
    body: JSON.stringify(point),
  });
}


export function stopRun(run_id) {
  return jsonFetch(`${FIT_API_BASE}/fit/runs/${run_id}/stop`, { method: 'POST' });
}
