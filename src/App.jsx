import FitIndex from './pages/fit/index';
import FitSync from './pages/fit/sync';
import FitCreate from './pages/fit/create';
import FitPlan from './pages/fit/plan';
import FitNutricion from './pages/fit/nutricion';
import FitProgreso from './pages/fit/progreso';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import MeasureSleep from './pages/michequeo/MeasureSleep';
import MeasureVitals from './pages/michequeo/MeasureVitals';
import HistoryPage from './pages/michequeo/History';
import Policy from './pages/Policy';
import Terms from './pages/Terms';

import Receipt from './pages/Receipt';
import PaymentGateway from './pages/PaymentGateway';
import FitCallback from './pages/FitCallback';
import ResetPassword from './pages/ResetPassword';





function App() {
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
            <Router>
              <div className="min-h-screen bg-vita-background">
                <Routes>
          {/* Rutas FIT (Fitness) */}
          <Route path="/fit" element={<ProtectedRoute><FitIndex /></ProtectedRoute>}>
            <Route index element={<FitPlan />} />
            <Route path="sync" element={<FitSync />} />
            <Route path="create" element={<FitCreate />} />
            <Route path="plan" element={<FitPlan />} />
            <Route path="nutricion" element={<FitNutricion />} />
            <Route path="progreso" element={<FitProgreso />} />
          </Route>
          {/* Redirects obligatorios */}
          <Route path="/mi-chequeo/peso" element={<Navigate to="/fit/nutricion" replace />} />
          <Route path="/mi-chequeo/talla" element={<Navigate to="/fit/nutricion" replace />} />
          <Route path="/bienestar/nutricion" element={<Navigate to="/fit/nutricion" replace />} />
          <Route path="/bienestar/nutricion/:slug" element={<Navigate to="/fit/nutricion" replace />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/legal" element={<Legal />} />
                    <Route path="/politicas-de-privacidad" element={<Policy />} />
                    <Route path="/terminos-y-condiciones" element={<Terms />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/coberturas" element={<ProtectedRoute><Coberturas /></ProtectedRoute>} />
                    
                    <Route path="/mi-chequeo" element={<ProtectedRoute><MiChequeo /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/nueva" element={<ProtectedRoute><NewMeasurement /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/test-alertas" element={<ProtectedRoute><TestAlerts /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/peso" element={<ProtectedRoute><MeasureWeight /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/sueno" element={<ProtectedRoute><MeasureSleep /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/vitals" element={<ProtectedRoute><MeasureVitals /></ProtectedRoute>} />
                    <Route path="/mi-chequeo/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                    
                    <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
                    
                    <Route path="/bienestar" element={<ProtectedRoute><Bienestar /></ProtectedRoute>} />
                    <Route path="/bienestar/nutricion/:slug" element={<ProtectedRoute><NutritionDetailPage /></ProtectedRoute>} />
                    <Route path="/bienestar/:category" element={<ProtectedRoute><WellnessCategoryPage /></ProtectedRoute>} />
                    <Route path="/bienestar/:category/:slug" element={<ProtectedRoute><WellnessDetailPage /></ProtectedRoute>} />

                      {/* Catch-all para rutas no encontradas: redirige a dashboard */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />

                    <Route path="/mi-plan" element={<ProtectedRoute><Pagos /></ProtectedRoute>} />
                    <Route path="/payment-gateway" element={<ProtectedRoute><PaymentGateway /></ProtectedRoute>} />
                    <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                    <Route path="/recibo/:paymentId" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
                    <Route path="/fit-auth-callback" element={<FitCallback />} />
                  </Routes>
                </div>
              </Router>
            <Toaster />
          </UserProvider>
        </AuthProvider>
      </>
    </HelmetProvider>
  );
}

export default App;