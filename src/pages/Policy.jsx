
import React from 'react';
import { Helmet } from 'react-helmet';

const Policy = () => {
  return (
    <>
      <Helmet>
        <title>Políticas de Privacidad - Vita365</title>
      </Helmet>
         <div className="text-gray-800 flex justify-center">
           <div className="w-full max-w-lg px-4 py-6 bg-white/80 rounded-xl shadow-md overflow-y-auto text-base">
           <h1 className="text-2xl md:text-3xl font-bold mb-6 text-vita-blue text-center">Políticas de Privacidad</h1>
           <div className="space-y-4">
          <p><strong>Última actualización:</strong> 03 de Septiembre de 2025</p>
          <p>En VitaCard 365, operado por Azisted S.A. de C.V. en conjunto con IGS Group Solution, valoramos y respetamos tu privacidad. Esta Política de Privacidad describe cómo recopilamos, usamos, protegemos y compartimos tu información personal de acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.</p>
          
          <h2 className="text-2xl font-bold pt-4 text-vita-blue">1. Identidad y Domicilio del Responsable</h2>
          <p>Azisted S.A. de C.V. ("VitaCard 365"), con domicilio en [Dirección Fiscal en México], es el responsable del tratamiento de tus datos personales.</p>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">2. Datos Personales que Recopilamos</h2>
          <p>Podemos recopilar las siguientes categorías de datos personales:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Datos de Identificación:</strong> Nombre completo, fecha de nacimiento, CURP, fotografía.</li>
              <li><strong>Datos de Contacto:</strong> Correo electrónico, número de teléfono.</li>
              <li><strong>Datos de Salud:</strong> Información que proporcionas voluntariamente en "Mi Chequeo" y "Test de Alertas", como peso, talla, presión arterial, síntomas y respuestas a cuestionarios de salud. Estos son considerados datos personales sensibles.</li>
              <li><strong>Datos de Pago:</strong> Información de tu tarjeta de crédito/débito y datos de facturación, procesados de forma segura a través de nuestro proveedor de pagos Mercado Pago.</li>
              <li><strong>Datos de Uso:</strong> Información sobre cómo interactúas con nuestra aplicación.</li>
          </ul>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">3. Finalidades del Tratamiento</h2>
          <p>Tus datos personales serán utilizados para las siguientes finalidades:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Primarias:</strong>
                  <ul className="list-disc list-inside space-y-1 pl-6">
                      <li>Crear y gestionar tu cuenta de usuario.</li>
                      <li>Proveer los servicios de asistencia y coberturas contratados, operados por IGS Group Solution.</li>
                      <li>Procesar los pagos de tu membresía.</li>
                      <li>Mostrarte tu historial de salud y tendencias dentro de la app.</li>
                      <li>Contactarte para asuntos relacionados con tu membresía y servicios.</li>
                  </ul>
              </li>
              <li><strong>Secundarias:</strong>
                  <ul className="list-disc list-inside space-y-1 pl-6">
                      <li>Mejorar nuestros servicios y la experiencia de usuario.</li>
                      <li>Enviarte comunicaciones promocionales o informativas, siempre que tengamos tu consentimiento.</li>
                  </ul>
              </li>
          </ul>
          <p>El tratamiento de tus datos personales sensibles de salud tiene como única finalidad que puedas llevar un registro personal y utilizar las herramientas de la aplicación. No se compartirán sin tu consentimiento expreso.</p>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">4. Transferencia de Datos</h2>
          <p>Podremos transferir tus datos personales a IGS Group Solution y su red de proveedores para la correcta prestación de los servicios de asistencia incluidos en tu membresía. Cualquier transferencia se realizará con las medidas de seguridad adecuadas y en cumplimiento con la LFPDPPP.</p>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">5. Derechos ARCO</h2>
          <p>Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (ARCO) al tratamiento de tus datos personales. Para ejercer estos derechos, por favor envía una solicitud a nuestro correo electrónico de contacto: <a href="mailto:contacto@vitacard365.com" className="text-vita-orange underline">contacto@vitacard365.com</a>.</p>

          <h2 className="text-2xl font-bold pt-4 text-vita-blue">6. Seguridad de los Datos</h2>
          <p>Implementamos medidas de seguridad físicas, técnicas y administrativas para proteger tus datos. La información de pago es gestionada directamente por Mercado Pago, cumpliendo con los más altos estándares de seguridad de la industria de pagos.</p>

           <h2 className="text-2xl font-bold pt-4 text-vita-blue">7. Cambios al Aviso de Privacidad</h2>
          <p>Nos reservamos el derecho de efectuar en cualquier momento modificaciones o actualizaciones al presente aviso de privacidad. Te notificaremos de cualquier cambio a través de la aplicación o por correo electrónico.</p>
        </div>
           </div>
         </div>
    </>
  );
};

export default Policy;
  