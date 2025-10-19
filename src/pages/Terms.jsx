
import React from 'react';
import { Helmet } from 'react-helmet';

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Términos y Condiciones - Vita365</title>
      </Helmet>
        <div className="text-gray-800 flex justify-center">
          <div className="w-full max-w-lg px-4 py-6 bg-white/80 rounded-xl shadow-md overflow-y-auto text-base">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-vita-blue text-center">Términos y Condiciones de Uso</h1>
            <div className="space-y-4">
          <p><strong>Última actualización:</strong> 03 de Septiembre de 2025</p>
          <p>Bienvenido a VitaCard 365. Al descargar, acceder o utilizar nuestra aplicación, aceptas estos Términos y Condiciones ("Términos"). Por favor, léelos detenidamente.</p>
          
          <h2 className="text-2xl font-bold pt-4 text-vita-blue">1. El Servicio</h2>
          <p>VitaCard 365 ("el Servicio") es una membresía de asistencia integral que ofrece diversas coberturas y herramientas de monitoreo de salud. Los servicios de asistencia (médica, vial, legal, etc.) son operados y proporcionados por nuestro socio estratégico, IGS Group Solution, y su red de proveedores.</p>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">2. Naturaleza de la Información</h2>
          <p>Las herramientas como "Mi Chequeo" y "Test de Alertas" son para fines informativos y de seguimiento personal. <strong>NO constituyen un diagnóstico médico, una consulta médica ni un servicio de urgencias.</strong> La información y recomendaciones generadas por la aplicación no deben sustituir el juicio clínico de un profesional de la salud. En caso de emergencia o si te sientes en peligro, debes contactar a los servicios de emergencia locales inmediatamente.</p>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">3. Membresía y Pagos</h2>
          <p>Tu membresía se activa al realizar el primer pago. Los pagos son recurrentes según la frecuencia que elijas (mensual, trimestral, etc.).</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Suspensión por Falta de Pago:</strong> Si tu pago no se procesa en la fecha de vencimiento, tu cuenta será suspendida después de 3 días de gracia. Durante la suspensión, no podrás acceder a las coberturas de asistencia.</li>
              <li><strong>Cancelación por Falta de Pago:</strong> Si el pago no se regulariza dentro de los 15 días posteriores a la fecha de vencimiento, tu membresía será cancelada automáticamente.</li>
              <li><strong>Cancelación por parte del Usuario:</strong> Puedes cancelar tu membresía en cualquier momento desde la sección "Pagos" en la app. La cancelación será efectiva al final de tu ciclo de facturación actual. No se ofrecen reembolsos por periodos parciales.</li>
          </ul>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">4. Uso de Coberturas</h2>
          <p>Para solicitar un servicio de asistencia, debes contactar a la línea telefónica designada disponible en la app. El registro de "uso" dentro de la aplicación es una herramienta de seguimiento personal; el registro oficial lo lleva a cabo el centro de atención de IGS Group Solution al momento de tu llamada.</p>
          
          <h2 className="text-2xl font-bold pt-4 text-vita-blue">5. Propiedad Intelectual</h2>
          <p>Todo el contenido, diseño, logos y funcionalidades de la aplicación son propiedad de Kódigo Vivo S.A. de C.V. y están protegidos por las leyes de propiedad intelectual.</p>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">6. Limitación de Responsabilidad</h2>
          <p>VitaCard 365 y Azisted S.A. de C.V. no serán responsables por decisiones médicas o acciones tomadas basadas únicamente en la información de la aplicación. La responsabilidad por la prestación de los servicios de asistencia recae en IGS Group Solution y sus proveedores.</p>
          
          <h2 className="text-2xl font-bold pt-4 text-vita-blue">7. Ley Aplicable y Jurisdicción</h2>
          <p>Estos Términos se regirán por las leyes de los Estados Unidos Mexicanos. Para cualquier disputa, las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;
  