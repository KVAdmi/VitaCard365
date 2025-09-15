import { useEffect, useRef } from "react";

let mpInitialized = false;

export default function MPWallet({ amount, onGenerate }) {
  const scriptRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (mpInitialized) return;
    mpInitialized = true;

    let timeoutId;

    const createButton = () => {
      if (!containerRef.current) return;
      
      timeoutId = setTimeout(() => {
        try {
          const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);
          mp.bricks().create('wallet', 'mp_wallet_container', {
            initialization: {
              amount,
              preferenceId: null
            },
            callbacks: {
              onSubmit: onGenerate,
              onError: (error) => {
                console.log('MP Error:', error);
                if (error.type === 'non_critical') {
                  createButton();
                }
              }
            },
            customization: {
              visual: {
                hideMessage: true
              }
            }
          });
        } catch (err) {
          console.error('Error creating MP button:', err);
        }
      }, 100);
    };

    if (!window.MercadoPago) {
      const script = document.createElement('script');
      scriptRef.current = script;
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = createButton;
      document.body.appendChild(script);
    } else {
      createButton();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scriptRef.current) {
        const script = scriptRef.current;
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }
      mpInitialized = false;
    }
  }, []); // Solo se ejecuta una vez al montar el componente

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-white/80 mb-4">Pago seguro con:</div>
      <div ref={containerRef} id="mp_wallet_container" className="w-full max-w-sm" />
    </div>
  );
}
