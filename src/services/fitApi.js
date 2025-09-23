const FIT_API_BASE = import.meta.env.VITE_FIT_URL;

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

export function startRun(p = {}) {
  // p: { user_id, type, source }
  const user_id = p.user_id;
  const source = p.source ?? 'manual';
  const type = p.type ?? 'running'; // que coincida con el CHECK
  return jsonFetch(`${FIT_API_BASE}/fit/runs/start`, {
    method: 'POST',
    body: JSON.stringify({ user_id, source, type }),
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
