import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const app = document.querySelector('#root');
      if (app) app.scrollTop = 0;
    } catch {}
  }, [pathname]);
  return null;
}
