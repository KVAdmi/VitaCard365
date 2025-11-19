import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DebugHUD = () => {
  const [open, setOpen] = useState(false);
  const { user, access, loading } = useAuth?.() || {};

  const envInfo = useMemo(() => {
    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'NO-SET',
      anonKeyStatus: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      mode: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
    };
  }, []);

  const userInfo = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
    };
  }, [user]);

  const accessInfo = useMemo(() => {
    if (!access) return null;
    return {
      activo: access.activo,
      origen: access.origen,
      tipo_vita: access.tipo_vita,
      plan_status: access.plan_status,
      codigo_vita: access.codigo_vita,
    };
  }, [access]);

  // Si quieres que SOLO aparezca en debug, descomenta esto:
  // if (!import.meta.env.DEV) return null;

  return (
    <>
      {/* Botoncito flotante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 99999,
          borderRadius: 999,
          padding: '8px 14px',
          fontSize: 11,
          border: '1px solid rgba(255,255,255,0.3)',
          background: open
            ? 'rgba(220, 38, 38, 0.9)'
            : 'rgba(15, 23, 42, 0.85)',
          color: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {open ? 'Cerrar HUD' : 'HUD'}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 56,
            right: 16,
            zIndex: 99998,
            width: '88%',
            maxWidth: 380,
            maxHeight: '65vh',
            overflowY: 'auto',
            borderRadius: 12,
            padding: 12,
            fontSize: 11,
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,118,110,0.96))',
            color: '#e5e7eb',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            border: '1px solid rgba(148,163,184,0.6)',
          }}
        >
          <div
            style={{
              marginBottom: 6,
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            VITA DEBUG HUD
          </div>

          <Section title="ENV">
            <Row label="MODE" value={envInfo.mode} />
            <Row label="DEV" value={String(envInfo.isDev)} />
            <Row label="SUPABASE_URL" value={envInfo.supabaseUrl} />
            <Row label="ANON_KEY" value={envInfo.anonKeyStatus} />
          </Section>

          <Section title="AUTH">
            <Row label="loading" value={String(loading)} />
            <Row label="hasUser" value={String(!!user)} />
            <Row
              label="user.id"
              value={userInfo?.id || '(sin user)'}
              mono
            />
            <Row
              label="user.email"
              value={userInfo?.email || '(sin user)'}
              mono
            />
          </Section>

          <Section title="ACCESS">
            <Row label="hasAccess" value={String(!!access)} />
            <Row
              label="activo"
              value={
                accessInfo?.activo === undefined
                  ? '(sin campo)'
                  : String(accessInfo.activo)
              }
            />
            <Row label="origen" value={accessInfo?.origen || '(n/a)'} />
            <Row
              label="tipo_vita"
              value={accessInfo?.tipo_vita || '(n/a)'}
            />
            <Row
              label="plan_status"
              value={accessInfo?.plan_status || '(n/a)'}
            />
            <Row
              label="codigo_vita"
              value={accessInfo?.codigo_vita || '(n/a)'}
              mono
            />
          </Section>

          <Section title="EXTRA">
            <div style={{ opacity: 0.8 }}>
              Mira esto mientras navegas:
              <ul style={{ paddingLeft: 14, marginTop: 4 }}>
                <li>• Después de login</li>
                <li>• Al ir a “Mi perfil”</li>
                <li>• Al volver de Mercado Pago</li>
                <li>• Al reabrir la app sin cerrar sesión</li>
              </ul>
            </div>
          </Section>
        </div>
      )}
    </>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        color: '#a5b4fc',
      }}
    >
      {title}
    </div>
    <div
      style={{
        borderRadius: 8,
        padding: 6,
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid rgba(51,65,85,0.8)',
      }}
    >
      {children}
    </div>
  </div>
);

const Row = ({ label, value, mono }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 3,
    }}
  >
    <div style={{ opacity: 0.7, minWidth: 90 }}>{label}</div>
    <div
      style={{
        flex: 1,
        textAlign: 'right',
        fontFamily: mono ? 'monospace' : 'system-ui',
        wordBreak: 'break-all',
      }}
    >
      {value}
    </div>
  </div>
);

export default DebugHUD;