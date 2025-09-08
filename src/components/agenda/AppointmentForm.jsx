import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const AppointmentForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    datetime: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Format date for datetime-local input
        datetime: initialData.datetime ? new Date(initialData.datetime).toISOString().slice(0, 16) : ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      datetime: new Date(formData.datetime).toISOString() // Store as ISO string
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={formData.title} onChange={handleChange} placeholder="Ej. Consulta con Dra. López" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="datetime">Fecha y Hora</Label>
        <Input id="datetime" type="datetime-local" value={formData.datetime} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Ubicación (Opcional)</Label>
        <Input id="location" value={formData.location} onChange={handleChange} placeholder="Ej. Consultorio 123" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={formData.notes} onChange={handleChange} placeholder="Ej. Llevar últimos análisis" />
      </div>
      <Button type="submit" className="w-full bg-vita-orange">
        {initialData ? 'Guardar Cambios' : 'Agregar Cita'}
      </Button>
    </form>
  );
};

export default AppointmentForm;