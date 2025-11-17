import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ymwhgkeomyuevsckljdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2hna2VvbXl1ZXZzY2tsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTg1NTEsImV4cCI6MjA3MjQzNDU1MX0.MGrQkn4-XQFCWD-RrKjLnAIQQNFvr8eVO8HeOfpWW7o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

const statusEl = document.getElementById('status');
const form = document.getElementById('reset-form');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('password-confirm');
const submitBtn = document.getElementById('submit-btn');
const actions = document.getElementById('actions');
const deeplinkAnchor = document.getElementById('deeplink-anchor');
const openAppBtn = document.getElementById('open-app-btn');

let userEmail = '';
let sessionReady = false;

function setStatus(type, message) {
  statusEl.textContent = message;
  statusEl.classList.remove('success', 'error');
  statusEl.style.display = 'block';
  if (type) statusEl.classList.add(type);
}

function setFormEnabled(enabled) {
  passwordInput.disabled = !enabled;
  confirmInput.disabled = !enabled;
  submitBtn.disabled = !enabled;
}

function buildDeeplink() {
  return `vitacard365://auth/recovery-done${userEmail ? `?email=${encodeURIComponent(userEmail)}` : ''}`;
}

function exposeDeeplink() {
  const deeplink = buildDeeplink();
  deeplinkAnchor.href = deeplink;
  openAppBtn.onclick = () => {
    window.location.href = deeplink;
  };
  actions.classList.add('visible');
}

async function ensureSessionFromUrl() {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace('#', ''));
  const searchParams = url.searchParams;
  const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
  const code = searchParams.get('code') || hashParams.get('code');

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error || !data.session) return false;
    return true;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) return false;
    return true;
  }

  return false;
}

async function bootstrap() {
  setStatus(null, 'Validando enlace de recuperación...');
  setFormEnabled(false);

  const validSession = await ensureSessionFromUrl();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!validSession || !sessionData?.session) {
    setStatus('error', 'El enlace expiró o no es válido. Solicita uno nuevo desde “Olvidé mi contraseña”.');
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  userEmail = userData?.user?.email || '';
  sessionReady = true;
  setFormEnabled(true);
  setStatus('success', 'Enlace válido. Ingresa tu nueva contraseña.');
}

form.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  if (!sessionReady) {
    setStatus('error', 'No hay sesión de recuperación activa. Vuelve a solicitar el enlace.');
    return;
  }

  const pwd = passwordInput.value.trim();
  const pwd2 = confirmInput.value.trim();

  if (pwd.length < 8) {
    setStatus('error', 'La contraseña debe tener mínimo 8 caracteres.');
    return;
  }
  if (pwd !== pwd2) {
    setStatus('error', 'Las contraseñas no coinciden.');
    return;
  }

  setFormEnabled(false);
  setStatus(null, 'Actualizando contraseña...');

  const { error } = await supabase.auth.updateUser({ password: pwd });
  if (error) {
    setStatus('error', 'No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo de nuevo.');
    setFormEnabled(true);
    return;
  }

  setStatus('success', '¡Contraseña actualizada! Abriendo la app...');
  exposeDeeplink();
  const deeplink = buildDeeplink();
  setTimeout(() => {
    window.location.href = deeplink;
  }, 350);
});

bootstrap();
