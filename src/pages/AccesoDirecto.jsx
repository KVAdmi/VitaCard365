import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const AccesoDirecto = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#F5F6FA' }}>
      <h1 style={{ color: '#1A237E', marginBottom: 24 }}>Acceso directo a VitaCard365</h1>
      <Button onClick={() => navigate('/dashboard')} style={{ fontSize: 18, padding: '12px 32px' }}>
        Entrar al sitio
      </Button>
      <p style={{ marginTop: 32, color: '#333', fontSize: 16 }}>Este acceso no requiere autenticación.<br />Solo para pruebas o acceso rápido.</p>
    </div>
  );
};

export default AccesoDirecto;
