import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';

const VitalForm = ({ fields, onSubmit, onSave, submitText = "Analizar" }) => {
  const [formData, setFormData] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow only numbers and specific characters like '/'
    if (fields.find(f => f.name === name)?.type === 'tel' && !/^[0-9./]*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type || "text"}
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={handleChange}
              required
              inputMode={field.type === 'tel' ? 'numeric' : undefined}
            />
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button type="submit" size="lg" className="w-full bg-vita-orange">
          {submitText}
        </Button>
        {onSave && (
          <Button onClick={() => onSave(formData)} size="lg" variant="outline" className="w-full border-vita-orange text-vita-orange hover:bg-vita-orange/10 hover:text-vita-orange">
            <Save className="mr-2 h-5 w-5" />
            Guardar
          </Button>
        )}
      </motion.div>
    </form>
  );
};

export default VitalForm;