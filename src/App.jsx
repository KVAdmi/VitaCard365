import FitIndex from './pages/fit/index';
import FitSyncPage from './pages/fit/FitSyncPage.jsx';
import FitCreate from './pages/fit/create';
import FitPlan from './pages/fit/plan';
import FitNutricion from './pages/fit/nutricion';
import GymCatalog from './pages/fit/gym/Catalog.jsx';
import GymCircuit from './pages/fit/gym/CircuitBuilder.jsx';
import GymRunner from './pages/fit/gym/Runner.jsx';
import GymPlan from './pages/fit/gym/Plan.jsx';
import GymProgreso from './pages/fit/gym/Progreso.jsx';
import FitProgreso from './pages/fit/progreso';
import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Coberturas from './pages/Coberturas';
import MiChequeo from './pages/MiChequeo';
import Agenda from './pages/Agenda';
import Bienestar from './pages/Bienestar';
import Pagos from './pages/Pagos';
import Perfil from './pages/Perfil';
import ProtectedRoute from './components/ProtectedRoute';
import Legal from './pages/Legal';
import WellnessCategoryPage from './pages/wellness/WellnessCategoryPage';
import WellnessDetailPage from './pages/wellness/WellnessDetailPage';
import NutritionDetailPage from './pages/wellness/NutritionDetailPage';
import NewMeasurement from './pages/michequeo/NewMeasurement';
import TestAlerts from './pages/michequeo/TestAlerts';
import MeasureWeight from './pages/michequeo/MeasureWeight';
// Sleep module eliminado del router
// import MeasureSleep from './pages/michequeo/MeasureSleep';
// import { ENABLE_SLEEP_MODULE } from './config';
import MeasureVitals from './pages/michequeo/MeasureVitals';
import HistoryPage from './pages/michequeo/History';
import Policy from './pages/Policy';
import Terms from './pages/Terms';

import Receipt from './pages/Receipt';
import PaymentGateway from './pages/PaymentGateway';
import FitCallback from './pages/FitCallback';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import { useEffect } from 'react';
import { initAuthDeepLinks } from '@/lib/deeplinks';
import '@/lib/auth'; // inicializa listener de deep link (auth-callback)
import IntroVideo from './pages/IntroVideo';
import ScrollToTop from './components/ScrollToTop';
import { Capacitor } from '@capacitor/core';
import Eco from './pages/Eco';
import Wallet from './pages/perfil/Wallet';
import '@/lib/sessionHydrator';





function App() {
  useEffect(()=>{ initAuthDeepLinks(); },[]);
  try {
    const protocol = (typeof window !== 'undefined' && window.location?.protocol) || '';
    const isNative = (typeof Capacitor?.isNativePlatform==='function' && Capacitor.isNativePlatform()) || protocol === 'capacitor:' || protocol === 'file:';
    console.log('[Router] native?', isNative);
    console.log('[Router] href/hash', window.location?.href, window.location?.hash);
  } catch {}
  return (
    <HelmetProvider>
      <>
        <Helmet>
          <title>VitaCard 365 | Asistencia Médica Integral</title>
          <meta name="description" content="Tu membresía médica integral con beneficios reales y asistencia 24/7." />
          <meta property="og:title" content="VitaCard 365 | Asistencia Médica Integral" />
          <meta property="og:description" content="Tu membresía médica integral con beneficios reales y asistencia 24/7." />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Helmet>
        
        <AuthProvider>
          <UserProvider>
            {(() => {
              const protocol = (typeof window !== 'undefined' && window.location?.protocol) || '';
              const isNative = (typeof Capacitor?.isNativePlatform === 'function' && Capacitor.isNativePlatform()) || protocol === 'capacitor:' || protocol === 'file:';
              const RouterCmp = isNative ? HashRouter : BrowserRouter;
              const notFoundTarget = isNative ? '/' : '/dashboard';
              return (
                <RouterCmp>
                  <ScrollToTop />
                  <div className="min-h-screen bg-vita-background">
                    <Routes>
          {/* Rutas FIT (Fitness) */}
          <Route path="/fit" element={<ProtectedRoute><FitIndex /></ProtectedRoute>}>
            <Route index element={<FitPlan />} />
            <Route path="sync" element={<FitSyncPage />} />
            <Route path="create" element={<FitCreate />} />
            <Route path="plan" element={<FitPlan />} />
            <Route path="nutricion" element={<FitNutricion />} />
            <Route path="progreso" element={<FitProgreso />} />
            {/* Gym module (additive, read-only) */}
            <Route path="gym">
              <Route path="catalog" element={<GymCatalog />} />
              <Route path="circuit" element={<GymCircuit />} />
              <Route path="run" element={<GymRunner />} />
              <Route path="plan" element={<GymPlan />} />
              <Route path="progreso" element={<GymProgreso />} />
            </Route>
          </Route>
          {/* Intro: raíz muestra el video y luego navega a /login */}
          <Route path="/" element={<IntroVideo />} />
          {/* Hash vacío (#) en Android puede no resolver a '/': servir Intro */}
          <Route path="" element={<IntroVideo />} />
          {/* Android WebView puede iniciar en /index.html; mapearlo a IntroVideo */}
          <Route path="/index.html" element={<IntroVideo />} />
          {/* En este flujo, home = login */}
          <Route path="/home" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/legal" element={<Legal />} />
                    <Route path="/politicas-de-privacidad" element={<Policy />} />
                    <Route path="/terminos-y-condiciones" element={<Terms />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/coberturas" element={<ProtectedRoute><Coberturas /></ProtectedRoute>} />
                    
                    <Route path="/mi-chequeo" element={<ProtectedRoute><MiChequeo /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/nueva" element={<ProtectedRoute><NewMeasurement /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/test-alertas" element={<ProtectedRoute><TestAlerts /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/peso" element={<ProtectedRoute><MeasureWeight /></ProtectedRoute>} />
                    {/* Ruta de Sueño eliminada */}
                    <Route path="/mi-chequeo/vitals" element={<ProtectedRoute><MeasureVitals /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                    
                    <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
                    
                    <Route path="/bienestar" element={<ProtectedRoute><Bienestar /></ProtectedRoute>} />
                    <Route path="/eco" element={<ProtectedRoute><Eco /></ProtectedRoute>} />
                    <Route path="/bienestar/nutricion/:slug" element={<ProtectedRoute><NutritionDetailPage /></ProtectedRoute>} />
                    <Route path="/bienestar/:category" element={<ProtectedRoute><WellnessCategoryPage /></ProtectedRoute>} />
                    <Route path="/bienestar/:category/:slug" element={<ProtectedRoute><WellnessDetailPage /></ProtectedRoute>} />

                      {/* Catch-all: en nativo redirige a Intro; en web a dashboard */}
                      <Route path="*" element={<Navigate to={notFoundTarget} replace />} />

                    <Route path="/mi-plan" element={<ProtectedRoute><Pagos /></ProtectedRoute>} />
                    <Route path="/payment-gateway" element={<ProtectedRoute><PaymentGateway /></ProtectedRoute>} />
                    <Route path="/paymentgateway" element={<Navigate to="/payment-gateway" replace />} />
                    <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                    <Route path="/perfil/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                    <Route path="/recibo/:paymentId" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
                    <Route path="/fit-auth-callback" element={<FitCallback />} />
                    </Routes>
                  </div>
                </RouterCmp>
              );
            })()}
            <Toaster />
          </UserProvider>
        </AuthProvider>
      </>
    </HelmetProvider>
  );
}

export default App;