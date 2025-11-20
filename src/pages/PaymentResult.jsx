
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentResult = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extraer los query params existentes (ejemplo: status)
    const search = location.search || '';
    navigate(`/payment/estado${search}`, { replace: true });
  }, [navigate, location]);
  return null;
};

export default PaymentResult;
