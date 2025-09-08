import React from 'react';
import { Button } from '../ui/button';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = window.location.origin + '/';

function getGoogleOAuthUrl() {
  const scope = 'openid email profile';
  return `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&include_granted_scopes=true`;
}

const GoogleLoginButton = ({ onSuccess }) => {
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(res => res.json())
        .then(user => {
          if (onSuccess) onSuccess({ ...user, accessToken });
        });
      window.location.hash = '';
    }
  }, [onSuccess]);

  const handleGoogleLogin = () => {
    window.location.href = getGoogleOAuthUrl();
  };

  return (
    <Button onClick={handleGoogleLogin} variant="outline" size="lg" className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">
      <img className="w-6 h-6 mr-3" alt="Google logo" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" />
      Continuar con Google
    </Button>
  );
};

export default GoogleLoginButton;
