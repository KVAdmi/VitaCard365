import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '../components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Wind, Waves, Dumbbell, Moon, Salad, Star, ArrowRight } from 'lucide-react';
import { wellnessData } from '../data/wellness-data.js';

const wellnessCategories = [
  {
    slug: 'tips',
    title: wellnessData.tips.name,
    description: 'Consejos diarios para una vida mejor.',
    icon: Brain,
    color: 'text-vita-orange',
  },
  {
    slug: 'nutricion',
    title: wellnessData.nutricion.name,
    description: 'Guías y planes para una alimentación sana.',
    icon: Salad,
    color: 'text-vita-orange',
  },
  {
    slug: 'respiracion',
    title: wellnessData.respiracion.name,
    description: 'Ejercicios guiados para calmar tu mente.',
    icon: Wind,
    color: 'text-vita-orange',
  },
  {
    slug: 'rutinas',
    title: wellnessData.rutinas.name,
    description: 'Actívate con ejercicios cortos y efectivos.',
    icon: Dumbbell,
    color: 'text-vita-orange',
  },
  {
    slug: 'sueno',
    title: wellnessData.sueno.name,
    description: 'Mejora tu descanso y energía.',
    icon: Moon,
    color: 'text-vita-orange',
  },
];

const Bienestar = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Bienestar - Vita365</title>
        <meta name="description" content="Descubre tips de bienestar, rutinas de ejercicio, técnicas de respiración y hábitos saludables con Vita365." />
      </Helmet>

      <Layout title="Bienestar" showBackButton>
        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wellnessCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card 
                    className="h-full cursor-pointer hover:border-vita-orange transition-all duration-300" 
                    onClick={() => navigate(`/bienestar/${category.slug}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <Icon className={`w-10 h-10 ${category.color}`} />
                        <div>
                          <CardTitle className="text-vita-white">{category.title}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Bienestar;