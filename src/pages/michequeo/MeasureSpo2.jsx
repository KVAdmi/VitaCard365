
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/use-toast';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const MeasureSpo2 = () => {
  const [spo2, setSpo2] = useState('');
  const [pulso, setPulso] = useState('');
  const [history, setHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await supabase
        .from('mediciones')
        .select('*')
        .eq('tipo', 'spo2')
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
      spo2: parseFloat(spo2),
      pulso_bpm: parseInt(pulso, 10),
      tipo: 'spo2',
      ts: new Date().toISOString(),
      source: 'manual',
    };
    const { error } = await supabase.from('mediciones').insert([payload]);
    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '¡Guardado!', description: 'Medición registrada.' });
    setSpo2('');
    setPulso('');
    // Refresca historial
    const { data } = await supabase
      .from('mediciones')
      .select('*')
      .eq('tipo', 'spo2')
      .order('ts', { ascending: false });
    setHistory(data || []);
  };



  return (
    <MeasureLayout title="SpO₂ (Oxigenación)" subtitle="Registra tu oxigenación y pulso.">
      <form onSubmit={handleSave} className="space-y-4">
        <Input type="number" step="0.1" min="70" max="100" placeholder="SpO₂ (%)" value={spo2} onChange={e => setSpo2(e.target.value)} required />
        <Input type="number" min="30" max="230" placeholder="Pulso (BPM)" value={pulso} onChange={e => setPulso(e.target.value)} required />
        <Button type="submit">Guardar</Button>
      </form>
      <div className="mt-6">
        <h3 className="text-white font-bold mb-2">Historial</h3>
        <ul className="text-white text-sm space-y-1">
          {history.map((h, i) => (
            <li key={h.id || i}>{new Date(h.ts).toLocaleString()} - SpO₂: {h.spo2}% Pulso: {h.pulso_bpm} bpm</li>
          ))}
        </ul>
      </div>
    </MeasureLayout>
  );
};

export default MeasureSpo2;