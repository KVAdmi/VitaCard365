import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Vita365Logo from '@/components/Vita365Logo';
import Policy from '@/pages/Policy';
import Terms from '@/pages/Terms';

const Legal = () => {
    const location = useLocation();
    const isPolicyPage = location.pathname === '/politicas-de-privacidad';
    const isTermsPage = location.pathname === '/terminos-y-condiciones';
    const pageTitle = isPolicyPage ? 'Políticas de Privacidad' : 'Términos y Condiciones';
    
  return (
    <>
      <Helmet>
        <title>{pageTitle} - Vita365</title>
        <meta name="description" content={`${pageTitle} de Vita365.`} />
      </Helmet>
      <div className="min-h-screen bg-white text-gray-800">
        <header className="sticky top-0 z-50 p-4 md:p-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b">
          <Link to="/">
            <Vita365Logo className="h-8 text-2xl text-vita-blue" />
          </Link>
          <Button asChild variant="ghost" className="hover:bg-gray-100 text-vita-blue">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
            </Link>
          </Button>
        </header>
        
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="max-w-4xl mx-auto text-justify">
               {isPolicyPage && <Policy />}
               {isTermsPage && <Terms />}
            </div>
        </main>

        <footer className="py-8 px-6 border-t bg-gray-50 text-center text-gray-500">
            <div className="container mx-auto">
                <p>&copy; {new Date().getFullYear()} Vita365. Todos los derechos reservados.</p>
            </div>
        </footer>
      </div>
    </>
  );
};

export default Legal;