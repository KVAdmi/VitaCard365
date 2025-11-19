// Crear mi rutina (onboarding objetivo/lugar/nivel)

import React from 'react';
import CreateRoutine from '@/features/rutinas/CreateRoutine';
import Layout from '@/components/Layout';

const objetivos = [
  { label: 'grasa', value: 'grasa' },
  { label: 'musculo', value: 'musculo' },
  { label: 'movilidad', value: 'movilidad' },
  { label: 'cardio', value: 'cardio' },
  { label: 'mixto', value: 'mixto' },
];
const lugares = [ 'Gym', 'Casa' ];
const diasSemana = [3, 4, 5];
const minutosSesion = [20, 25, 30, 35, 40, 45];
const niveles = [ 'Básico', 'Intermedio', 'Avanzado', 'Pro' ];
const equipos = [ 'ninguno', 'tapete', 'toalla', 'mochila', 'superficie' ];

export default function FitCreate() {
  return (
    <Layout title="Crear rutina" showBackButton>
      <div className="px-4 py-2">
        <CreateRoutine />
      </div>
    </Layout>
  );
}
