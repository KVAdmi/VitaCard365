import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Usa variables de entorno si Netlify las define; si no, fallback a las mismas del proyecto
const SUPABASE_URL =
  window.SUPABASE_URL || 'https://ymwhgkeomyuevsckljdw.supabase.co';
const SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2hna2VvbXl1ZXZzY2tsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTg1NTEsImV4cCI6MjA3MjQzNDU1MX0.MGrQkn4-XQFCWD-RrKjLnAIQQNFvr8eVO8HeOfpWW7o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 👇 AQUÍ ESTABA EL BUG
// Antes solo leía lo que venía *después* de "?#", y si el hash era
// "access_token=..." lo ignoraba. Ahora tratamos TODO el hash como query
// si no hay "?".
const qs = new URLSearchParams(window.location.search || '');

const rawHash = window.location.hash?.startsWith('#')
  ? window.location.hash.slice(1)
  : window.location.hash || '';

const hashQuery =
  rawHash.indexOf('?') >= 0 ? rawHash.split('?')[1] : rawHash || '';

const hq = new URLSearchParams(hashQuery);

const elIntro = document.getElementById('intro');
const form = document.getElementById('reset-form');
const msg = document.getElementById('msg');

const btnOpenApp = document.getElementById('open-app');


function showForm() {
  form.classList.remove('hidden');
  elIntro.textContent = 'Introduce tu nueva contraseña';
}

// Toggle de visibilidad de contraseña (ojito)
document.addEventListener('DOMContentLoaded', () => {
  // Ojito para ambos inputs
  ['pwd1', 'pwd2'].forEach((id) => {
    const input = document.getElementById(id);
    const btn = document.querySelector(`button.toggle-visibility[data-target="${id}"]`);
    if (!input || !btn) return;
    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword
        ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
        : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-7.06M1 1l22 22"/><circle cx="12" cy="12" r="3"></circle></svg>';
    });
  });
});

function showMsg(text, type = 'ok') {
  msg.textContent = text;
  msg.className = `alert ${type}`;
}

function getParam(name) {
  return qs.get(name) || hq.get(name) || '';
}

async function ensureRecoverySession() {
  try {
    console.log('[recovery-web] location.href:', window.location.href);
    console.log('[recovery-web] search:', window.location.search);
    console.log('[recovery-web] hash:', window.location.hash);

    // 1) Caso típico: hash con access_token/refresh_token
    const accessToken = hq.get('access_token');
    const refreshToken = hq.get('refresh_token');
    if (accessToken && refreshToken) {
      console.log('[recovery-web] detectado hash con tokens');
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      console.log(
        '[recovery-web] setSession OK?',
        !!data?.session,
        data?.session?.user?.id
      );
      return !!data?.session;
    }

    // 2) OTP recovery (?token=&type=recovery) en search o hash
    const token = getParam('token') || getParam('token_hash');
    const type = getParam('type') || 'recovery';
    const email = getParam('email') || undefined;

    if (token && type === 'recovery') {
      console.log('[recovery-web] detectado OTP de recovery');
      const { data, error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token,
        email,
      });
      if (error) throw error;
      console.log(
        '[recovery-web] verifyOtp OK?',
        !!data?.session,
        data?.session?.user?.id
      );
      return !!data?.session;
    }

    // 3) PKCE (?code=...) por si Supabase lo usa
    const code = qs.get('code');
    if (code) {
      console.log('[recovery-web] detectado code PKCE');
      const { data, error } =
        await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) throw error;
      console.log(
        '[recovery-web] exchangeCodeForSession OK?',
        !!data?.session,
        data?.session?.user?.id
      );
      return !!data?.session;
    }

    // 4) Si viene explicitamente error_code=otp_expired, mostramos mensaje claro
    const errorCode = qs.get('error_code') || hq.get('error_code');
    if (errorCode === 'otp_expired') {
      showMsg(
        'Enlace inválido o expirado. Solicita uno nuevo desde "Olvidé mi contraseña".',
        'error'
      );
      return false;
    }

    // Nada útil en la URL
    console.warn('[recovery-web] No se encontraron tokens ni code en la URL');
    return false;
  } catch (e) {
    console.error('[recovery-web] ensureRecoverySession error', e);
    showMsg(
      'Enlace inválido o expirado. Solicita uno nuevo desde "Olvidé mi contraseña".',
      'error'
    );
    return false;
  }
}

async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
}

(async () => {
  // El botón abrir app solo debe abrir el deep link con email si existe
  btnOpenApp?.addEventListener('click', () => {
    let email = getParam('email');
    // Intentar obtener el email actual si no viene en la URL
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        email = email || userData?.user?.email || '';
      } catch {}
      const deeplink = `vitacard365://auth/recovery-done${email ? `?email=${encodeURIComponent(email)}` : ''}`;
      window.location.href = deeplink;
    })();
  });

  const ok = await ensureRecoverySession();
  // Mostramos SIEMPRE el formulario, nunca lo ocultamos
  showForm();
  if (!ok) {
    showMsg(
      'Enlace inválido o expirado. Solicita uno nuevo desde "Olvidé mi contraseña".',
      'error'
    );
    // Deshabilitar inputs y botón guardar, pero el form sigue visible
    document.getElementById('pwd1').disabled = true;
    document.getElementById('pwd2').disabled = true;
    document.getElementById('btn-save').disabled = true;
  }

  // Indicador de fortaleza
  const pwdInput = document.getElementById('pwd1');
  const strengthBars =
    document.getElementById('strength-bars')?.querySelectorAll('.bar');
  const hint = document.getElementById('pwd-hint');

  function calcStrength(p) {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score; // 0..4
  }

  function renderStrength(p) {
    const s = calcStrength(p);
    strengthBars?.forEach((bar, i) => {
      bar.classList.remove('active', 'ok');
      if (i < s) {
        bar.classList.add(i < 2 ? 'active' : 'ok');
      }
    });
    if (!p) {
      hint.textContent = 'Mínimo 8 caracteres.';
    } else if (s <= 1) {
      hint.textContent = 'Fortaleza: débil';
    } else if (s === 2) {
      hint.textContent = 'Fortaleza: media';
    } else if (s === 3) {
      hint.textContent = 'Fortaleza: buena';
    } else {
      hint.textContent = 'Fortaleza: excelente';
    }
  }

  pwdInput?.addEventListener('input', (e) => renderStrength(e.target.value));
  renderStrength('');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg.className = 'alert hidden';

    const pwd1 = document.getElementById('pwd1').value.trim();
    const pwd2 = document.getElementById('pwd2').value.trim();

    if (pwd1.length < 8) {
      showMsg('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    if (pwd1 !== pwd2) {
      showMsg('Las contraseñas no coinciden.', 'error');
      return;
    }

    try {
      await updatePassword(pwd1);

      // Intentar obtener el email para pasarlo a la app
      let email = getParam('email');
      try {
        const { data: userData } = await supabase.auth.getUser();
        email = email || userData?.user?.email || '';
      } catch {
        // no pasa nada
      }

      showMsg('¡Contraseña actualizada! Puedes abrir la app.', 'ok');

      // Botón manual visible y funcional, siempre con email si existe
      const deeplink = `vitacard365://auth/recovery-done${email ? `?email=${encodeURIComponent(email)}` : ''}`;
      if (btnOpenApp) {
        btnOpenApp.classList.remove('hidden');
        btnOpenApp.onclick = () => {
          window.location.href = deeplink;
        };
      }

      // Espera 300ms antes de disparar el deep link automático
      setTimeout(() => {
        window.location.href = deeplink;
      }, 300);
    } catch (e) {
      console.error('[recovery-web] updatePassword error', e);
      showMsg(
        'No pudimos actualizar tu contraseña. Intenta de nuevo.',
        'error'
      );
    }
  });
})();
