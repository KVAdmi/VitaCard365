import { useEffect } from 'react';
import { saveFitToken } from '../hooks/useGoogleFitAuth';
import { useNavigate } from 'react-router-dom';

export default function FitCallback() {
  const nav = useNavigate();
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('access_token');
    const exp = hash.get('expires_in');
    if (token) {
      saveFitToken(token, exp);
  nav('/perfil');
    } else {
  nav('/perfil?fit=error');
    }
  }, [nav]);
  return null;
}
