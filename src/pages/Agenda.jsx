import NeonSelect from '@/components/neon/NeonSelect';
import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import { createAgendaEvent, fetchUpcomingAgenda, fetchAgendaRange, updateAgendaEvent, deleteAgendaEvent } from '@/lib/agenda';

export default function AgendaPage(){
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [form, setForm] = useState({
    type: 'medicamento',
    title: '',
    description: '',
    event_date: new Date().toISOString().slice(0,10),
    event_time: '08:00:00',
    notify: true,
    repeat_type: 'none',
  });
  const [editingId, setEditingId] = useState(null);

  // Calendario
  const today = new Date();
  const [monthCursor, setMonthCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthEvents, setMonthEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);

  async function load(){
    setLoading(true);
    const data = await fetchUpcomingAgenda(30);
    setEvents(data);
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    (async ()=>{
      const start = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
      const end = new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1, 0);
      const data = await fetchAgendaRange(start, end);
      setMonthEvents(data);
    })();
  }, [monthCursor]);

  async function onSubmit(e){
    e.preventDefault();
    try{
      if (editingId) {
        await updateAgendaEvent(editingId, form);
        toast({ title: 'Evento actualizado', description: 'Se reprogramaron notificaciones si corresponde.' });
      } else {
        await createAgendaEvent(form);
        toast({ title: 'Evento guardado', description: 'Se programará una notificación si corresponde.' });
      }
      setForm(f=>({ ...f, title:'', description:'' }));
      setShowForm(false);
      setEditingId(null);
      await load();
      const start = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
      const end = new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1, 0);
      const data = await fetchAgendaRange(start, end);
      setMonthEvents(data);
    }catch(e){
      toast({ title: 'Error al guardar', description: e.message || 'Intenta de nuevo', variant: 'destructive' });
    }
  }

  async function onEdit(ev){
    setEditingId(ev.id);
    setForm({
      type: ev.type,
      title: ev.title,
      description: ev.description || '',
      event_date: ev.event_date,
      event_time: ev.event_time,
      notify: !!ev.notify,
      repeat_type: ev.repeat_type || 'none',
    });
    setSelectedDate(new Date(ev.event_date+'T'+ev.event_time));
    setShowForm(true);
  }

  async function onDelete(ev){
    if (!window.confirm('¿Eliminar este evento?')) return;
    try{
      await deleteAgendaEvent(ev.id);
      toast({ title: 'Evento eliminado', description: 'Se cancelaron notificaciones si había.' });
      await load();
      const start = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
      const end = new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1, 0);
      const data = await fetchAgendaRange(start, end);
      setMonthEvents(data);
    }catch(e){
      toast({ title: 'Error al eliminar', description: e.message || 'Intenta de nuevo', variant: 'destructive' });
    }
  }

  // Utilidades calendario
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const monthName = monthCursor.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const gridDays = useMemo(()=>{
    const arr = [];
    for (let i=0;i<startWeekday;i++) arr.push(null);
    for (let d=1; d<=daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month, startWeekday, daysInMonth]);

  const eventsByDay = useMemo(()=>{
    const map = new Map();
    for (const ev of monthEvents) {
      const key = ev.event_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [monthEvents]);

  return (
    <Layout title="Agenda" showBackButton>
      <div className="p-4 space-y-6">
        {/* Calendario mensual */}
        <Card className="relative bg-white/10 border border-cyan-400/20" style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.18)' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <Button variant="ghost" onClick={()=>setMonthCursor(new Date(year, month-1, 1))}><ChevronLeft className="w-5 h-5"/></Button>
            <CardTitle className="capitalize tracking-tight text-cyan-100">{monthName}</CardTitle>
            <Button variant="ghost" onClick={()=>setMonthCursor(new Date(year, month+1, 1))}><ChevronRight className="w-5 h-5"/></Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-xs text-cyan-100/80 mb-1">
              {['L','M','X','J','V','S','D'].map(d=> (
                <div key={d} className="text-center opacity-80">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {gridDays.map((d,idx)=>{
                if (!d) return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-white/5 border border-white/5"/>;
                const key = d.toISOString().slice(0,10);
                const has = eventsByDay.has(key);
                const isSel = selectedDate && key===selectedDate.toISOString().slice(0,10);
                return (
                  <button key={key}
                          onClick={()=>{ setSelectedDate(d); setForm(f=>({...f, event_date: key})); setShowForm(true); }}
                          className={`relative h-16 rounded-xl text-left p-2 border transition-all ${isSel ? 'bg-cyan-400/15 border-cyan-300/30' : 'bg-white/10 border-cyan-400/10 hover:bg-cyan-400/10'} ${has ? 'ring-1 ring-[color:var(--vc-primary,#f06340)]/70' : ''}`}
                          style={{ boxShadow: has ? '0 0 18px rgba(240,99,64,0.18)' : undefined }}
                          title={has ? `${eventsByDay.get(key).length} evento(s)` : ''}>
                    <div className="text-[11px] font-semibold drop-shadow-sm">{d.getDate()}</div>
                    {has && (
                      <span className="absolute bottom-1 right-1 inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--vc-primary,#f06340)] shadow-[0_0_8px_rgba(240,99,64,0.6)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="bg-white/10 border border-cyan-400/20" style={{ boxShadow:'0 0 0 1px rgba(0,255,231,0.18)' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? 'Editar evento' : 'Nuevo evento'} — {form.event_date}</CardTitle>
              <div className="flex items-center gap-2">
                {editingId && (
                  <Button variant="ghost" onClick={()=>{ setEditingId(null); setShowForm(false); }}>Cancelar</Button>
                )}
                <Button variant="ghost" onClick={()=>{ setEditingId(null); setShowForm(false); }}>Cerrar</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <NeonSelect variant="cyan" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}
                    options={[
                      { value: 'medicamento', label: 'Medicamento' },
                      { value: 'cita_medica', label: 'Cita médica' },
                      { value: 'otro', label: 'Otro' },
                    ]} placeholder="Tipo" />
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
                  <NeonSelect variant="cyan" value={form.repeat_type} onChange={e=>setForm({...form, repeat_type:e.target.value})}
                    options={[
                      { value: 'none', label: 'No repetir' },
                      { value: 'daily', label: 'Diario' },
                      { value: 'weekly', label: 'Semanal' },
                      { value: 'monthly', label: 'Mensual' },
                    ]} placeholder="Repetición" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="notify" type="checkbox" className="accent-orange-500" checked={!!form.notify} onChange={e=>setForm({...form, notify:e.target.checked})} />
                  <Label htmlFor="notify">Notificarme</Label>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" className="flex-1">{editingId ? 'Actualizar' : 'Guardar'}</Button>
                  {editingId && (
                    <Button type="button" variant="destructive" onClick={()=>onDelete({id: editingId})}>Eliminar</Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/10 border border-cyan-400/20" style={{ boxShadow:'0 0 0 1px rgba(0,255,231,0.18)' }}>
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
                    <div className="flex items-center gap-2">
                      <button onClick={()=>onEdit(ev)} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs">Editar</button>
                      <button onClick={()=>onDelete(ev)} className="px-3 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs">Eliminar</button>
                      {ev.notify ? <span className="text-green-400 text-xs">Con aviso</span> : <span className="text-white/50 text-xs">Sin aviso</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Botón flotante para crear evento rápido */}
        <div className="fixed bottom-20 right-5 z-20">
          <Button className="rounded-full bg-[color:var(--vc-primary,#f06340)] shadow-[0_0_24px_rgba(240,99,64,0.4)]" onClick={()=>{ const d=new Date(); setSelectedDate(d); setForm(f=>({ ...f, event_date: d.toISOString().slice(0,10) })); setShowForm(true); }}>
            <Plus className="w-5 h-5 mr-2"/>Agregar evento
          </Button>
        </div>
      </div>
    </Layout>
  );
}
 
  