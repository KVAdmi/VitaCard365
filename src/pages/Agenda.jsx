
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pill, Stethoscope, Edit, Trash2, Download, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import MedicineForm from '@/components/agenda/MedicineForm';
import AppointmentForm from '@/components/agenda/AppointmentForm';

const Agenda = () => {
  const { toast } = useToast();
  const [medicines, setMedicines] = useLocalStorage('vita365_medicines', []);
  const [appointments, setAppointments] = useLocalStorage('vita365_appointments', []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('medicinas');

  useEffect(() => {
    const timeouts = [];
    medicines.forEach(med => {
      if (!med.taken) {
        const [hours, minutes] = med.time.split(':');
        const now = new Date();
        const medTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
        const timeToAlert = medTime.getTime() - now.getTime();
        
        if(timeToAlert > 0) {
          const timeoutId = setTimeout(() => {
            alert(`Hora de tu medicina: ${med.name} - ${med.dose}`);
          }, timeToAlert);
          timeouts.push(timeoutId);
        }
      }
    });

    appointments.forEach(appt => {
      const apptTime = new Date(appt.datetime);
      const now = new Date();
      const timeToAlert = apptTime.getTime() - now.getTime() - (4 * 60 * 60 * 1000); // 4 hours before

      if(timeToAlert > 0) {
        const timeoutId = setTimeout(() => {
          alert(`Recuerda tu cita médica: ${appt.title} a las ${apptTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
        }, timeToAlert);
        timeouts.push(timeoutId);
      }
    });

    return () => timeouts.forEach(clearTimeout);
  }, [medicines, appointments]);

  const handleAddItem = (item) => {
    if (activeTab === 'medicinas') {
      setMedicines([...medicines, { ...item, id: uuidv4(), taken: false }]);
      toast({ title: 'Medicina agregada', description: `${item.name} se ha añadido a tu agenda.` });
    } else {
      setAppointments([...appointments, { ...item, id: uuidv4() }]);
      toast({ title: 'Cita agregada', description: `${item.title} se ha añadido a tu agenda.` });
    }
    setDialogOpen(false);
  };

  const handleEditItem = (item) => {
    if (activeTab === 'medicinas') {
      setMedicines(medicines.map(m => m.id === item.id ? item : m));
      toast({ title: 'Medicina actualizada', description: `${item.name} se ha actualizado.` });
    } else {
      setAppointments(appointments.map(a => a.id === item.id ? item : a));
      toast({ title: 'Cita actualizada', description: `${item.title} se ha actualizado.` });
    }
    setEditingItem(null);
    setDialogOpen(false);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      if (activeTab === 'medicinas') {
        setMedicines(medicines.filter(m => m.id !== id));
        toast({ title: 'Medicina eliminada' });
      } else {
        setAppointments(appointments.filter(a => a.id !== id));
        toast({ title: 'Cita eliminada' });
      }
    }
  };

  const toggleMedicineTaken = (id) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };
  
  const handleExport = () => {
    const data = JSON.stringify({ medicines, appointments }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vita365_agenda.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Agenda exportada', description: 'Tus datos se han guardado en un archivo JSON.' });
  };

  return (
    <>
      <Helmet>
        <title>Agenda - Vita365</title>
        <meta name="description" content="Organiza tus medicamentos y citas médicas con la agenda de Vita365." />
      </Helmet>

      <Layout title="Agenda" showBackButton>
        <div className="p-4 md:p-6 pb-20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="medicinas"><Pill className="mr-2 h-4 w-4" />Medicinas</TabsTrigger>
                <TabsTrigger value="citas"><Stethoscope className="mr-2 h-4 w-4" />Citas Médicas</TabsTrigger>
              </TabsList>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="medicinas">
                  {medicines.length === 0 ? (
                    <Card className="text-center p-10">
                      <p className="text-vita-white">No tienes medicinas en tu agenda.</p>
                      <p className="text-vita-muted-foreground text-sm mt-1">Usa el botón '+' para agregar una.</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {medicines.map(med => (
                        <Card key={med.id} className="flex items-center justify-between p-4">
                           <div className="flex items-center">
                             <input type="checkbox" checked={med.taken} onChange={() => toggleMedicineTaken(med.id)} className="h-6 w-6 rounded-full text-vita-orange focus:ring-vita-orange bg-white/20 border-white/30" />
                             <div className="ml-4">
                               <p className={`font-bold ${med.taken ? 'line-through text-vita-muted-foreground' : 'text-vita-white'}`}>{med.name}</p>
                               <p className="text-sm text-vita-muted-foreground">{med.dose} - {med.time}</p>
                             </div>
                           </div>
                           <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white" onClick={() => { setEditingItem(med); setDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500" onClick={() => handleDeleteItem(med.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                           </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="citas">
                  {appointments.length === 0 ? (
                    <Card className="text-center p-10">
                      <p className="text-vita-white">No tienes citas en tu agenda.</p>
                      <p className="text-vita-muted-foreground text-sm mt-1">Usa el botón '+' para agregar una.</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map(appt => (
                        <Card key={appt.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-vita-white">{appt.title}</p>
                              <p className="text-sm text-vita-muted-foreground">{new Date(appt.datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                              {appt.location && <p className="text-sm text-vita-muted-foreground">Lugar: {appt.location}</p>}
                              {appt.notes && <p className="text-sm text-vita-white mt-2">Nota: {appt.notes}</p>}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white" onClick={() => { setEditingItem(appt); setDialogOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500" onClick={() => handleDeleteItem(appt.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>

          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditingItem(null); } setDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="icon" className="fixed bottom-24 right-6 md:bottom-8 md:right-8 h-16 w-16 bg-vita-orange rounded-full shadow-lg z-50">
                <Plus className="h-8 w-8" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar' : 'Agregar'} {activeTab === 'medicinas' ? 'Medicina' : 'Cita'}</DialogTitle>
              </DialogHeader>
              {activeTab === 'medicinas' ? (
                <MedicineForm
                  onSubmit={editingItem ? handleEditItem : handleAddItem}
                  initialData={editingItem}
                />
              ) : (
                <AppointmentForm
                  onSubmit={editingItem ? handleEditItem : handleAddItem}
                  initialData={editingItem}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
      <footer className="fixed bottom-[72px] left-0 right-0 bg-vita-background/80 backdrop-blur-sm p-3 text-center border-t border-white/10">
        <div className="flex items-center justify-center text-xs text-white/70">
            <Info className="h-4 w-4 mr-2" />
            <span>Descarga tus archivos, por seguridad se eliminarán en unos días.</span>
        </div>
      </footer>
    </>
  );
};

export default Agenda;
  