// src/pages/MiPlan.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '../lib/supabaseClient';

// Simulación de datos de plan y familiares (reemplaza por fetch real/Supabase)
const mockPlan = {
  type: "familiar", // "individual" o "familiar"
  titular: { nombre: "Juan Pérez" },
  familiares: [
    { nombre: "Ana Pérez" },
    { nombre: "Luis Pérez" },
  ],
  fechaCompra: "2025-09-14T13:00:00Z",
  frecuencia: "trimestral", // monthly, quarterly, semiannually, annually
};

const FRECUENCIA_MESES = {
  monthly: 1,
  quarterly: 3,
  semiannually: 6,
  annually: 12,
};

function calcularProximaFecha(fechaCompra, frecuencia) {
  const meses = FRECUENCIA_MESES[frecuencia] || 1;
  const fecha = new Date(fechaCompra);
  fecha.setMonth(fecha.getMonth() + meses);
  return fecha.toLocaleDateString();
}

export default function MiPlan() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [familiares, setFamiliares] = useState([]);
  const [plan, setPlan] = useState(null);

  // Extrae nombre y folio Vita del usuario
  const clienteNombre = user?.user_metadata?.name || 'Cliente';
  const folioVita = user?.user_metadata?.vita_card_id || 'FOLIO';

  // Descarga el PDF desde Supabase Storage y lo nombra correctamente
  const handleDescargarPoliza = async (nombre, folio) => {
    setDownloading(true);
    try {
      // Ruta del archivo base en el bucket
      const filePath = `certificados/${folio}.pdf`;
      // Obtiene URL firmada (válida por 60s)
      const { data, error } = await supabase.storage.from('certificados').createSignedUrl(filePath, 60);
      if (error || !data?.signedUrl) {
        console.error('[MiPlan] createSignedUrl error:', error, data);
        throw new Error(error?.message || 'No se pudo obtener el certificado.');
      }
      // Descarga el archivo
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        const text = await response.text().catch(() => 'no-body');
        console.error('[MiPlan] fetch signedUrl failed', response.status, response.statusText, text);
        throw new Error(`No se pudo descargar el certificado. (${response.status})`);
      }
      const blob = await response.blob();
      // Construye nombre personalizado
      const nombreArchivo = `Poliza_VitaCard365_${folio}_${nombre.replace(/\s+/g,'_')}.pdf`;
      // Descarga en navegador
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 200);
    } catch (e) {
      console.error('[MiPlan] descargar poliza failed:', e);
      alert(`No se pudo descargar la póliza. ${e?.message || 'Intenta más tarde.'}`);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    // Fetch plan y familiares reales
    (async () => {
      if (!user) return;
      // Fetch plan del titular
      const { data: planData } = await supabase
        .from('profiles_certificado_v2')
        .select('membresia,periodicidad,estado_pago,fecha_compra,frecuencia')
        .eq('user_id', user.id)
        .maybeSingle();
      setPlan(planData);
      // Fetch familiares si el plan es familiar
      if (planData?.membresia === 'familiar') {
        const { data: fams } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id);
        setFamiliares(fams || []);
      } else {
        setFamiliares([]);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0b1a2b] text-white px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mi Plan</h1>
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 mb-6 flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-2">Resumen de tu Plan</h2>
        <p className="text-white/70 text-sm mb-4 text-center">Aquí puedes ver el estado actual de tu membresía VitaCard 365.<br/>Descarga tu póliza/certificado en PDF dando clic en el botón.</p>
        <div className="flex w-full justify-center mb-4">
          <button
            onClick={() => handleDescargarPoliza(clienteNombre, folioVita)}
            disabled={downloading}
            className="px-6 py-3 rounded-xl bg-gradient-to-br from-orange-400/80 to-orange-600/80 text-white font-bold shadow-lg backdrop-blur-md border border-orange-200/30 hover:scale-105 active:scale-95 transition-all text-base"
            style={{boxShadow:'0 4px 24px 0 #f0634033'}}
          >
            {downloading ? 'Descargando...' : 'Descargar mi póliza VC 365'}
          </button>
        </div>
        {plan && (
          <>
            <div className="flex justify-between items-center mb-2 w-full max-w-md">
              <span>Tipo de Plan</span>
              <span className="font-bold">{plan.membresia === "familiar" ? "Familiar" : "Individual"}</span>
            </div>
            <div className="flex justify-between items-center mb-2 w-full max-w-md">
              <span>Fecha de compra</span>
              <span>{plan.fecha_compra ? new Date(plan.fecha_compra).toLocaleDateString() : '—'}</span>
            </div>
            <div className="flex justify-between items-center mb-2 w-full max-w-md">
              <span>Próximo Pago</span>
              <span>{plan.fecha_compra && plan.frecuencia ? calcularProximaFecha(plan.fecha_compra, plan.frecuencia) : '—'}</span>
            </div>
          </>
        )}
      </div>

      {plan?.membresia === 'familiar' && familiares.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2">Miembros del Plan</h2>
          <div className="rounded-xl bg-white/10 border border-white/20 p-4">
            <div className="mb-2">
              <span className="font-bold">Titular:</span> {clienteNombre}
            </div>
            <span className="font-bold">Familiares asegurados:</span>
            <div className="mt-1 grid gap-2">
              {familiares.map((f, idx) => (
                <div key={f.id} className="rounded bg-white/20 px-3 py-2 flex flex-col gap-1">
                  <span className="font-semibold">{f.display_name}</span>
                  <span>Parentesco: {f.relation || '—'}</span>
                  <span>Fecha de nacimiento: {f.birthdate ? new Date(f.birthdate).toLocaleDateString() : '—'}</span>
                  <span>Folio Vita: {f.codigo_vita || '—'}</span>
                  <span>Periodicidad: {f.periodicidad || '—'}</span>
                  <span>Estado: {f.estado || '—'}</span>
                  <span>Próximo pago: {f.fecha_compra && f.periodicidad ? calcularProximaFecha(f.fecha_compra, f.periodicidad) : '—'}</span>
                  <button
                    onClick={() => handleDescargarPoliza(f.display_name, f.codigo_vita)}
                    disabled={downloading}
                    className="mt-2 px-4 py-2 rounded bg-orange-500 text-white font-bold shadow hover:bg-orange-600"
                  >
                    {downloading ? 'Descargando...' : `Descargar póliza de ${f.display_name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
