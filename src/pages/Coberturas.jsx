import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Stethoscope, 
  Car, 
  Heart, 
  Dumbbell, 
  Home, 
  Cross,
  Scale,
  Info,
  CheckCircle,
  AlertCircle,
  Phone
} from 'lucide-react';

const Coberturas = () => {
  const { coverageUsage, trackCoverageUsage } = useUser();
  const [selectedCategory, setSelectedCategory] = useState('medica');
  const [confirmingService, setConfirmingService] = useState(null);
  const { toast } = useToast();

  const categories = [
    { id: 'medica', name: 'Médica', icon: Stethoscope },
    { id: 'legal', name: 'Legal', icon: Scale },
    { id: 'vial', name: 'Vial', icon: Car },
    { id: 'mascotas', name: 'Mascotas', icon: Heart },
    { id: 'fitness', name: 'Fitness', icon: Dumbbell },
    { id: 'hogar', name: 'Hogar', icon: Home },
    { id: 'funeraria', name: 'Funeraria', icon: Cross }
  ];

  const services = {
    medica: [
      { id: 'ambulancia_terrestre', name: 'Ambulancia Terrestre por Emergencia', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
      { id: 'medico_domicilio', name: 'Médico general a domicilio', events: 2, unlimited: false, value: 'Hasta $1,000 MXN c/u' },
      { id: 'video_consulta', name: 'Video consulta médica con envío de receta digital', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
      { id: 'apoyo_medicamentos', name: 'Apoyo compra y envío de medicamentos', events: 2, unlimited: false, value: 'Hasta $500 MXN c/u' },
      { id: 'consulta_especialista', name: 'Consulta Médico especialista', events: 1, unlimited: false, value: 'Hasta $1,200' },
      { id: 'quimica_6_elementos', name: 'Química de 6 elementos y examen médico', events: 1, unlimited: false, value: 'Hasta $600 MXN' },
      { id: 'mastografia', name: 'Mastografía', events: 1, unlimited: false, value: 'Sin costo para el afiliado' },
      { id: 'orientacion_psicologica', name: 'Consulta u orientación telefónica psicológica 24 hrs', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
      { id: 'referencias_terapeutas', name: 'Referencias de terapeutas', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
      { id: 'limpieza_dental', name: 'Asistencia Dental - Limpieza Dental', events: 1, unlimited: false, value: 'Sin costo para el afiliado' },
    ],
    legal: [
      { id: 'asistencia_legal', name: 'Asistencia legal', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
      { id: 'orientacion_derechos_laborales', name: 'Orientación legal en derechos laborales', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
      { id: 'asesoria_familiar_civil', name: 'Asesoría presencial en temas familiares y Civiles', events: 2, unlimited: false, value: 'Sin costo para el afiliado' },
    ],
    vial: [
      { id: 'grua_falla_mecanica', name: 'Servicio de Grúa por falla mecánica (solo auto)', events: 1, unlimited: false, value: 'Hasta $1,000 MXN c/u' },
      { id: 'cambio_llanta', name: 'Cambio de llanta (auto y moto)', events: 2, unlimited: false, value: 'Hasta $800 MXN c/u (en combinación)' },
      { id: 'paso_corriente', name: 'Paso de corriente (auto y moto)', events: 2, unlimited: false, value: 'Hasta $800 MXN c/u (en combinación)' },
      { id: 'suministro_gasolina', name: 'Suministro de gasolina (auto y moto)', events: 2, unlimited: false, value: 'Hasta $800 MXN c/u (en combinación)' },
      { id: 'traslado_bicicleta', name: 'Traslado de la bicicleta', events: 1, unlimited: false, value: 'Sin costo para el afiliado' },
      { id: 'asistencia_telefonica_accidente', name: 'Asistencia telefónica por accidente', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
      { id: 'mantenimiento_bicicleta', name: 'Mantenimiento básico de la bicicleta', events: 1, unlimited: false, value: 'Hasta $500 MXN' },
      { id: 'medico_telefonico_vial', name: 'Médico Telefónico', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
    ],
    mascotas: [
      { id: 'consulta_veterinaria_emergencia', name: 'Consulta médica veterinaria por emergencia', events: 1, unlimited: false, value: 'Hasta $900 MXN c/u' },
      { id: 'vacunacion_antirrabica', name: 'Vacunación antirrábica', events: 1, unlimited: false, value: 'Hasta $500 MXN c/u' },
      { id: 'pipeta_antipulgas', name: 'Pipeta antipulgas', events: 1, unlimited: false, value: 'Hasta $400 MXN c/u' },
      { id: 'asistencia_legal_mascotas', name: 'Asistencia Legal Telefónica por daños a terceros', events: 1, unlimited: false, value: 'Sin costo para el afiliado' },
      { id: 'orientacion_veterinaria_telefonica', name: 'Orientación médica veterinaria telefónica', events: 0, unlimited: true, value: 'Sin costo para el afiliado' },
    ],
    fitness: [
      { id: 'orientacion_nutricional', name: 'Orientación nutricional telefónica y online', events: 0, unlimited: true, value: 'Sin límite de eventos' },
      { id: 'consulta_nutriologo', name: 'Consulta con nutriólogo para creación de dietas', events: 1, unlimited: false, value: 'Hasta $1,000 MXN c/u' },
      { id: 'referencia_gimnasios', name: 'Referencia y coordinación de gimnasios, spas y centros de estética', events: 0, unlimited: true, value: 'Sin límite de eventos' },
    ],
    hogar: [
      { id: 'plomero', name: 'Asistencia de Plomero para el Hogar', events: 2, unlimited: false, value: 'Hasta $800 MXN por servicio (en combinación)' },
      { id: 'cerrajero', name: 'Asistencia de Cerrajero para el Hogar', events: 2, unlimited: false, value: 'Hasta $800 MXN por servicio (en combinación)' },
      { id: 'electricista', name: 'Asistencia de Electricista para el Hogar', events: 2, unlimited: false, value: 'Hasta $800 MXN por servicio (en combinación)' },
    ],
    funeraria: [
      { id: 'servicios_funerarios', name: 'Servicios Funerarios', events: 1, unlimited: false, value: 'Hasta $18,000 MXN' }
    ]
  };

  const handleUseService = (service) => {
    window.location.href = 'tel:5593373553';
    setConfirmingService(service);
  };
  
  const confirmUsage = (used) => {
    if (used && confirmingService) {
      trackCoverageUsage(confirmingService.id);
      toast({
        title: "Uso Registrado",
        description: `Se ha registrado el uso de '${confirmingService.name}'.`,
      });
    }
    setConfirmingService(null);
  };

  const getServiceUsage = (serviceId) => coverageUsage[serviceId] || 0;
  const isServiceAvailable = (service) => service.unlimited || getServiceUsage(service.id) < service.events;
  const getAvailabilityText = (service) => {
    if (service.unlimited) return 'Ilimitado';
    const remaining = service.events - getServiceUsage(service.id);
    return `${remaining} de ${service.events} disponibles`;
  };

  return (
    <>
      <Helmet>
        <title>Coberturas - VitaCard 365</title>
        <meta name="description" content="Explora y gestiona todas las coberturas disponibles en tu plan VitaCard 365." />
      </Helmet>

      <Layout title="Coberturas" showBackButton>
        <div className="p-4 space-y-6">
          <Card className="bg-vita-blue-light border border-vita-orange/30">
            <CardContent className="p-4 flex items-start space-x-3">
              <Info className="h-5 w-5 text-vita-orange flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-vita-white">Detalle de tu Cobertura</h3>
                <p className="text-xs text-vita-muted-foreground">
                  Aquí puedes ver los detalles de tu plan y llevar un registro personal de los servicios utilizados. VitaCard 365 mantiene el registro oficial de tus solicitudes.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-3 rounded-xl text-center transition-all duration-300 flex flex-col items-center justify-center space-y-1.5 aspect-square ${
                  selectedCategory === category.id
                    ? 'bg-vita-orange text-white shadow-lg shadow-vita-orange/20'
                    : 'glass-card text-vita-white/80'
                }`}
              >
                <category.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-[10px] sm:text-xs font-semibold leading-tight">{category.name}</span>
              </motion.button>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-vita-white px-2">
              Servicios de {categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            
            <div className="space-y-3">
              {services[selectedCategory]?.map((service) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start space-x-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-vita-white text-base mb-1">
                            {service.name}
                          </h3>
                          <p className="text-xs text-vita-muted-foreground mb-2">{service.value}</p>
                          <div className={`flex items-center space-x-2 text-sm font-medium ${isServiceAvailable(service) ? 'text-green-400' : 'text-yellow-400'}`}>
                            {isServiceAvailable(service) ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            <span>{getAvailabilityText(service)}</span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          disabled={!isServiceAvailable(service)}
                          onClick={() => handleUseService(service)}
                          className="mt-1 flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4"/>
                          Usar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <Dialog open={!!confirmingService} onOpenChange={() => setConfirmingService(null)}>
          <DialogContent className="text-white">
            <DialogHeader>
              <DialogTitle className="text-vita-white">Confirmar Uso de Servicio</DialogTitle>
              <DialogDescription className="text-white/80">
                ¿Utilizaste el servicio "{confirmingService?.name}"? Esto nos ayuda a mantener tu registro de coberturas al día.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => confirmUsage(false)}>No, no lo usé</Button>
              <Button onClick={() => confirmUsage(true)}>Sí, lo usé</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  );
};

export default Coberturas;