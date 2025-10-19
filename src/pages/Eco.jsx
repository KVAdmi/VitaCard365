import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { Leaf, Recycle, Droplets, Trees, Truck, Sun } from 'lucide-react';

const Eco = () => {
  // Secciones principales como tarjetas desplegables (acordeón), siguiendo el patrón de Bienestar
  const sections = [
    {
      key: 'alimentos',
      icon: <Leaf className="h-5 w-5 text-vita-orange" />,
      title: 'Alimentación consciente',
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Prefiere productos locales y de temporada para reducir huella de carbono y ganar frescura.</li>
          <li>Reduce carne roja 1–3 días por semana; tu corazón y el planeta lo agradecen.</li>
          <li>Elige orgánico cuando puedas para evitar pesticidas y cuidar suelos y agua.</li>
          <li>Planifica comidas y compostea restos: menos metano, más nutrientes para la tierra.</li>
          <li>Evita plásticos en la cocina; usa vidrio o acero para almacenar y calentar.</li>
        </ul>
      )
    },
    {
      key: 'arboles',
      icon: <Trees className="h-5 w-5 text-vita-orange" />,
      title: '¿Qué árbol plantar en tu zona?',
      content: (
        <div className="space-y-2 text-sm">
          <p className="text-white/90">Prioriza especies nativas: requieren menos agua, atraen polinizadores y mejoran el suelo.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Clima templado: encinos, fresnos, jacarandas (consultando especies nativas locales).</li>
            <li>Clima seco: huizache, mezquite, palo verde; raíces profundas y resistentes a sequía.</li>
            <li>Clima húmedo tropical: guayabo, chicozapote, almendro; sombra y alimento.</li>
            <li>Urbano: árboles de porte medio con raíces no invasivas y copa amplia para sombra.</li>
          </ul>
          <p className="text-xs text-white/70">Tip: consulta el vivero municipal o listas de especies nativas de tu estado/país.</p>
        </div>
      )
    },
    {
      key: 'basura',
      icon: <Recycle className="h-5 w-5 text-vita-orange" />,
      title: 'Separación de residuos y reciclaje',
      content: (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-white">Guía rápida de separación</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Orgánicos: restos de comida, cáscaras, posos de café → compóstalos si puedes.</li>
              <li>Inorgánicos reciclables: papel/cartón, vidrio, metales, plásticos (limpios y secos).</li>
              <li>No reciclables: sanitarios, colillas, servilletas sucias, envolturas metalizadas.</li>
              <li>Peligrosos: pilas, electrónicos, aceites, medicinas → centros de acopio autorizados.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Plásticos: claves</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Evita de un solo uso: bolsas, popotes, cubiertos. Lleva tus reutilizables.</li>
              <li>Enjuaga y seca envases antes de reciclar para evitar rechazo en plantas.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      key: 'agua-energia',
      icon: <Droplets className="h-5 w-5 text-vita-orange" />,
      title: 'Agua y energía en casa',
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Arregla fugas y usa aireadores/regaderas ahorradoras; ahorras agua y dinero.</li>
          <li>Iluminación LED y desconexión de “vampiros” (stand-by) para bajar consumo.</li>
          <li>Ventila diario y prefiere limpieza natural (vinagre, bicarbonato, limón) para menos COVs.</li>
          <li>Paneles solares/termosifón si es viable; calienta agua con el sol.</li>
        </ul>
      )
    },
    {
      key: 'movilidad-aire',
      icon: <Truck className="h-5 w-5 text-vita-orange" />,
      title: 'Movilidad y calidad del aire',
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Camina o usa bici para trayectos cortos; combina con transporte público.</li>
          <li>Compartir coche y mantener llantas bien infladas reduce consumo y emisiones.</li>
          <li>Teletrabajo algunos días disminuye tráfico y estrés.</li>
          <li>Planta árboles de sombra en calles y patios; bajan la isla de calor urbana.</li>
        </ul>
      )
    },
    {
      key: 'huertos-urbanos',
      icon: <Sun className="h-5 w-5 text-vita-orange" />,
      title: 'Huertos y naturaleza en casa',
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Hierbas fáciles: albahaca, menta, romero; macetas con buen drenaje y sol.</li>
          <li>Polinizadores: flores nativas (asclepias, caléndulas) y agua limpia poco profunda.</li>
          <li>Interior saludable: potos, sansevieria, espatifilo — ayudan con la calidad del aire.</li>
        </ul>
      )
    }
  ];

  return (
    <>
      <Helmet>
        <title>Eco | Consejos Verdes</title>
        <meta name="description" content="Consejos prácticos que conectan ecología y bienestar para una vida más saludable y sostenible." />
      </Helmet>
      <Layout title="Eco" showBackButton>
        <div className="p-4 space-y-4">
          <Card className="bg-vita-blue-light border border-vita-orange/30">
            <CardContent className="p-4 flex items-start space-x-3">
              <Leaf className="h-5 w-5 text-vita-orange flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-vita-white">Ecología y Bienestar</h3>
                <p className="text-xs text-vita-muted-foreground">
                  Hábitos cortos, reales y accionables para mejorar tu salud y reducir tu impacto ambiental.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-vita-white flex items-center gap-2">
                <Leaf className="h-5 w-5 text-vita-orange" />
                Guías prácticas Eco
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Accordion type="single" collapsible className="w-full">
                {sections.map((s) => (
                  <AccordionItem key={s.key} value={s.key}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        {s.icon}
                        <span className="text-base font-semibold">{s.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-white/90 text-sm space-y-2">
                        {s.content}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
};

export default Eco;
