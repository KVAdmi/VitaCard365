import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.blood_pressure.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
].join(' ');

function getOAuthUrl() {
  const redirectUri = window.location.origin + '/';
  return `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(GOOGLE_FIT_SCOPES)}&include_granted_scopes=true`;
}

async function fetchStepCount(accessToken) {
  const now = new Date();
  const endTimeMillis = now.getTime();
  const startTimeMillis = endTimeMillis - 24 * 60 * 60 * 1000;
  const body = {
    aggregateBy: [{
      dataTypeName: 'com.google.step_count.delta',
      dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
    }],
    bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
    startTimeMillis,
    endTimeMillis
  };
  const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  let steps = 0;
  if (data.bucket && data.bucket.length > 0) {
    const dataset = data.bucket[0].dataset[0];
    if (dataset && dataset.point && dataset.point.length > 0) {
      steps = dataset.point.reduce((sum, p) => sum + (p.value[0]?.intVal || 0), 0);
    }
  }
  return steps;
}

async function saveMeasurementToSupabase(userId, steps) {
  const { error } = await supabase.from('measurements').insert({
    user_id: userId,
    type: 'steps',
    value: steps,
    date: new Date().toISOString(),
  });
  return error;
}

const GoogleFitCard = ({ user }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [steps, setSteps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detect access_token in URL after redirect
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const token = params.get('access_token');
      setAccessToken(token);
      window.location.hash = '';
    }
  }, []);

  const handleConnect = () => {
    window.location.href = getOAuthUrl();
  };

  const handleFetchSteps = async () => {
    setLoading(true);
    setError(null);
    try {
      const stepCount = await fetchStepCount(accessToken);
      setSteps(stepCount);
      if (user?.id) {
        const saveError = await saveMeasurementToSupabase(user.id, stepCount);
        if (saveError) setError('Error al guardar en Supabase');
      }
    } catch (err) {
      setError('Error al obtener datos de Google Fit');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Fit</CardTitle>
        <CardDescription>Conecta y consulta tus pasos de las últimas 24 horas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!accessToken ? (
          <Button onClick={handleConnect}>Conectar con Google Fit</Button>
        ) : (
          <Button onClick={handleFetchSteps} disabled={loading}>{loading ? 'Consultando...' : 'Obtener pasos'}</Button>
        )}
        {steps !== null && (
          <div className="mt-4 p-4 rounded bg-vita-blue text-white">
            <p><strong>Usuario:</strong> {user?.user_metadata?.name || user?.email}</p>
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Pasos (24h):</strong> {steps}</p>
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
};

export default GoogleFitCard;
