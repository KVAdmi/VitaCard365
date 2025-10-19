import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Printer, ArrowLeft } from 'lucide-react';
import Vita365Logo from '../components/Vita365Logo';

const Receipt = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const paymentDetails = user?.paymentDetails;

  const handlePrint = () => {
    window.print();
  };

  if (!paymentDetails || paymentDetails.paymentId !== paymentId) {
    return (
      <div className="min-h-screen bg-vita-background text-white flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recibo no encontrado</CardTitle>
            <CardDescription>No se pudo encontrar el recibo de pago. Por favor, verifica el enlace o contacta a soporte.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Recibo de Pago - VitaCard 365</title>
        <meta name="description" content="Recibo de tu pago de membresía VitaCard 365." />
      </Helmet>
      <div className="min-h-screen bg-gray-100 text-gray-800 p-4 sm:p-8 print:bg-white print:p-0">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg print:shadow-none print:rounded-none">
          <header className="flex justify-between items-center pb-6 border-b">
            <div>
              <Vita365Logo className="h-10 text-3xl text-vita-blue" />
              <p className="text-sm text-gray-500">Azisted S.A. de C.V.</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-700">Recibo de Pago</h2>
              <p className="text-sm text-gray-500">ID: {paymentId.substring(0, 8)}</p>
            </div>
          </header>

          <main className="my-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-600 mb-2">Facturado a:</h3>
                <p className="font-bold">{paymentDetails.cardholderName}</p>
                <p>{user.email}</p>
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-gray-600 mb-2">Detalles del Pago:</h3>
                <p><strong>Fecha de Pago:</strong> {new Date(paymentDetails.paymentDate).toLocaleDateString('es-MX')}</p>
                <p><strong>Método de Pago:</strong> Tarjeta de Crédito/Débito</p>
              </div>
            </div>

            <div className="mt-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 font-semibold">Descripción</th>
                    <th className="p-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">
                      <p className="font-bold">Membresía VitaCard 365</p>
                      <p className="text-sm text-gray-600 capitalize">Plan: {paymentDetails.plan} ({paymentDetails.frequency})</p>
                    </td>
                    <td className="p-3 text-right">${paymentDetails.totalAmount.toFixed(2)} MXN</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-right">
              <p className="text-gray-600">Subtotal: ${paymentDetails.totalAmount.toFixed(2)}</p>
              <p className="text-gray-600">Impuestos: $0.00</p>
              <p className="text-2xl font-bold mt-2">Total Pagado: ${paymentDetails.totalAmount.toFixed(2)} MXN</p>
            </div>
          </main>

          <footer className="text-center text-sm text-gray-500 pt-6 border-t">
            <p>Gracias por tu pago. Tu membresía está activa.</p>
            <p>Próxima fecha de pago: {new Date(paymentDetails.nextPaymentDate).toLocaleDateString('es-MX')}</p>
            <p className="mt-4">Si tienes alguna pregunta, contacta a <a href="mailto:contacto@vitacard365.com" className="text-vita-blue underline">contacto@vitacard365.com</a></p>
          </footer>
        </div>

        <div className="max-w-2xl mx-auto mt-8 flex justify-center gap-4 print:hidden">
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <Button onClick={handlePrint} className="bg-vita-orange">
            <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
          </Button>
        </div>
      </div>
    </>
  );
};

export default Receipt;