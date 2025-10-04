import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createAgendaEvent, fetchUpcomingAgenda } from '@/lib/agenda';
import { useToast } from '@/components/useToast';

export default function AgendaPage(){
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const [form, setForm] = useState({
    type: 'medicamento',
    title: '',
    description: '',
    event_date: new Date().toISOString().slice(0,10),
    event_time: '08:00:00',
    notify: true,
    repeat_type: 'none',
  });

  async function load(){
    setLoading(true);
    const data = await fetchUpcomingAgenda(30);
    setEvents(data);
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);

  async function onSubmit(e){
    e.preventDefault();
    try{
      await createAgendaEvent(form);
      success('Evento guardado y programado');
      setForm(f=>({ ...f, title:'', description:'' }));
      await load();
    }catch(e){
      error(e.message||'Error al guardar evento');
    }
  }

  return (
    <Layout title="Agenda" showBackButton>
      <div className="p-4 space-y-6">
        <Card className="bg-white/5">
          <CardHeader><CardTitle>Nuevo evento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <select className="w-full bg-white/10 rounded px-3 py-2" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                  <option value="medicamento">Medicamento</option>
                  <option value="cita_medica">Cita médica</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <Label>Título</Label>
                <Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
              </div>
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <Input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={form.event_date} onChange={e=>setForm({...form, event_date:e.target.value})} required />
              </div>
              <div>
                <Label>Hora</Label>
                <Input type="time" value={form.event_time.slice(0,5)} onChange={e=>setForm({...form, event_time:e.target.value+':00'})} required />
              </div>
              <div>
                <Label>Repetir</Label>
                <select className="w-full bg-white/10 rounded px-3 py-2" value={form.repeat_type} onChange={e=>setForm({...form, repeat_type:e.target.value})}>
                  <option value="none">No repetir</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input id="notify" type="checkbox" className="accent-orange-500" checked={!!form.notify} onChange={e=>setForm({...form, notify:e.target.checked})} />
                <Label htmlFor="notify">Notificarme</Label>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/5">
          <CardHeader><CardTitle>Próximos 30 días</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p>Cargando…</p> : events.length === 0 ? <p>No hay eventos.</p> : (
              <ul className="divide-y divide-white/10">
                {events.map(ev => (
                  <li key={ev.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{ev.title}</p>
                      <p className="text-sm text-white/70">{new Date(ev.event_date+'T'+ev.event_time).toLocaleString()}</p>
                      <p className="text-xs text-white/50">{ev.type} {ev.repeat_type && ev.repeat_type !== 'none' ? `· ${ev.repeat_type}` : ''}</p>
                    </div>
                    {ev.notify ? <span className="text-green-400 text-xs">Con aviso</span> : <span className="text-white/50 text-xs">Sin aviso</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
 
  