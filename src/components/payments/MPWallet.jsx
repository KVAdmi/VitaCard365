import { useEffect, useRef, useState } from "react";

export default function MPWallet({ amount, onGenerate, loading, error }) {
  const containerRef = useRef(null);
  const brickInstanceRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [mpError, setMpError] = useState(null);

  // Limpiar brick anterior
  const cleanupBrick = () => {
    if (brickInstanceRef.current) {
      try {
        brickInstanceRef.current.unmount();
      } catch (e) {
        console.log('Error unmounting brick:', e);
      }
      brickInstanceRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  // Crear botón de Mercado Pago
  const createMPButton = async () => {
    if (!containerRef.current || !window.MercadoPago) return;
    
    try {
      cleanupBrick();
      setMpError(null);
      
      const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);
      
      const brickInstance = await mp.bricks().create('wallet', 'mp_wallet_container', {
        initialization: {
          preferenceId: null // Se establecerá cuando se genere la preferencia
        },
        callbacks: {
          onReady: () => {
            console.log('MP Wallet ready');
            setIsReady(true);
          },
          onSubmit: async () => {
            try {
              await onGenerate();
            } catch (error) {
              console.error('Error en onSubmit:', error);
              setMpError('Error al procesar el pago');
            }
          },
          onError: (error) => {
            console.error('MP Wallet Error:', error);
            setMpError(error.message || 'Error en la pasarela de pago');
          }
        },
        customization: {
          visual: {
            hideMessage: true,
            style: {
              theme: 'dark'
            }
          }
        }
      });
      
      brickInstanceRef.current = brickInstance;
      
    } catch (error) {
      console.error('Error creating MP button:', error);
      setMpError('Error al inicializar la pasarela de pago');
    }
  };

  // Cargar SDK de Mercado Pago
  useEffect(() => {
    if (window.MercadoPago) {
      createMPButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      createMPButton();
    };
    script.onerror = () => {
      setMpError('Error al cargar Mercado Pago');
    };
    
    document.head.appendChild(script);

    return () => {
      cleanupBrick();
      // No remover el script ya que puede ser usado por otros componentes
    };
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      cleanupBrick();
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      {(error || mpError) && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error || mpError}
        </div>
      )}
      
      {loading && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
          Procesando pago...
        </div>
      )}
      
      <div 
        ref={containerRef} 
        id="mp_wallet_container" 
        className="w-full max-w-sm"
        style={{ minHeight: '48px' }}
      />
      
      {!isReady && !error && !mpError && !loading && (
        <div className="text-white/60 text-sm mt-2">
          Cargando pasarela de pago...
        </div>
      )}
    </div>
  );
}
