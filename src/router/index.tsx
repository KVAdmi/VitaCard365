import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import InvitePage from '@/pages/Invite';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useAuth } from '@/contexts/AuthContext';
import PaymentGateway from '@/pages/PaymentGateway';
import ProtectedRoute from '@/components/ProtectedRoute';
import KvGateHard from '@/guards/KvGateHard';

const { session } = useAuth();

// Ejemplo de wrapper para proteger /checkout
function CheckoutGate({ children }: { children: React.ReactNode }) {
  const { paywallEnabled } = useEntitlements(session, {});
  if (!paywallEnabled) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

// En tu definición de rutas:
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/invita" element={<InvitePage />} />
      <Route
        path="/checkout"
        element={
          <CheckoutGate>
            <div>Checkout</div>
          </CheckoutGate>
        }
      />
      <Route
        path="/payment-gateway"
        element={
          <KvGateHard>
            <PaymentGateway />
          </KvGateHard>
        }
      />
    </Routes>
  );
}