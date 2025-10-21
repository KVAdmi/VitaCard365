import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const MedicineForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    dose: '',
    time: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div
      style={{
        background: 'rgba(21,32,68,0.7)',
        backdropFilter: 'blur(6px)',
        borderRadius: '1rem',
        boxShadow: '0 4px 16px rgba(21,32,68,0.15)',
        padding: '1.5rem',
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la medicina</Label>
          <Input id="name" value={formData.name} onChange={handleChange} placeholder="Ej. Paracetamol" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dose">Dosis / Instrucciones</Label>
          <Input id="dose" value={formData.dose} onChange={handleChange} placeholder="Ej. 500mg" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Horario</Label>
          <Input id="time" type="time" value={formData.time} onChange={handleChange} required />
        </div>
        <Button type="submit" className="w-full bg-vita-orange">
          {initialData ? 'Guardar Cambios' : 'Agregar Medicina'}
        </Button>
      </form>
    </div>
  );
};

export default MedicineForm;