import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/use-toast';
import MeasureLayout from '../../components/michequeo/MeasureLayout';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const MeasureTemperature = () => {
  const [temperature, setTemperature] = useState('');
  const [history, setHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await supabase
        .from('mediciones')
        .select('*')
        .eq('tipo', 'temperatura')
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
      temperatura: parseFloat(temperature),
      tipo: 'temperatura',
      ts: new Date().toISOString(),
      source: 'manual',
    };
    const { error } = await supabase.from('mediciones').insert([payload]);
    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '¡Guardado!', description: 'Medición registrada.' });
    setTemperature('');
    // Refresca historial
    const { data } = await supabase
      .from('mediciones')
      .select('*')
      .eq('tipo', 'temperatura')
      .order('ts', { ascending: false });
    setHistory(data || []);
  };

  return (
    <MeasureLayout title="Temperatura" subtitle="Registra tu temperatura corporal.">
      <form onSubmit={handleSave} className="space-y-4">
        <Input type="number" step="0.1" min="30" max="45" placeholder="Temperatura (°C)" value={temperature} onChange={e => setTemperature(e.target.value)} required />
        <Button type="submit">Guardar</Button>
      </form>
      <div className="mt-6">
        <h3 className="text-white font-bold mb-2">Historial</h3>
        <ul className="text-white text-sm space-y-1">
          {history.map((h, i) => (
            <li key={h.id || i}>{new Date(h.ts).toLocaleString()} - {h.temperatura}°C</li>
          ))}
        </ul>
      </div>
    </MeasureLayout>
  );
};

export default MeasureTemperature;
