import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/use-toast';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const MeasureGlucose = () => {
  const [glucose, setGlucose] = useState('');
  const [history, setHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await supabase
        .from('glucosa')
        .select('*')
        .order('ts', { ascending: false });
      if (!error && data) setHistory(data);
    }
    fetchHistory();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const usuario_id = (await supabase.auth.getUser()).data.user?.id;
    if (!usuario_id) {
      toast({ title: 'No autenticado', description: 'Debes iniciar sesión.', variant: 'destructive' });
      return;
    }
    const payload = {
      usuario_id,
      glucosa: parseFloat(glucose),
      ts: new Date().toISOString(),
      source: 'manual',
    };
    const { error } = await supabase.from('glucosa').insert([payload]);
    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '¡Guardado!', description: 'Medición registrada.' });
    setGlucose('');
    // Refresca historial
    const { data } = await supabase
      .from('glucosa')
      .select('*')
      .order('ts', { ascending: false });
    setHistory(data || []);
  };

  return (
    <MeasureLayout title="Glucosa" subtitle="Registra tu nivel de glucosa en sangre.">
      <form onSubmit={handleSave} className="space-y-4">
        <Input type="number" step="0.1" min="40" max="600" placeholder="Glucosa (mg/dL)" value={glucose} onChange={e => setGlucose(e.target.value)} required />
        <Button type="submit">Guardar</Button>
      </form>
      <div className="mt-6">
        <h3 className="text-white font-bold mb-2">Historial</h3>
        <ul className="text-white text-sm space-y-1">
          {history.map((h, i) => (
            <li key={h.id || i}>{new Date(h.ts).toLocaleString()} - {h.glucosa} mg/dL</li>
          ))}
        </ul>
      </div>
    </MeasureLayout>
  );
};

export default MeasureGlucose;
