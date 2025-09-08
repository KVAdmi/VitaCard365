import { supabase } from './supabase';

// Ejemplo de cómo guardar datos vitales
export const saveVitals = async (userId, vitalsData) => {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase
    .from('vitals')
    .insert([{ user_id: userId, ...vitalsData }]);

  if (error) {
    console.error('Error saving vitals:', error);
    throw error;
  }
  return data;
};

// Ejemplo de cómo guardar datos de triage
export const saveTriage = async (userId, triageData) => {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase
    .from('triage_sessions')
    .insert([{ user_id: userId, ...triageData }]);

  if (error) {
    console.error('Error saving triage:', error);
    throw error;
  }
  return data;
};

// Placeholder para generar reportes
export const generateReport = async (userId, reportType) => {
  if (!supabase) throw new Error("Supabase no está configurado.");
  console.log('Generating report for user:', userId, 'Type:', reportType);
  // Aquí iría la lógica para llamar a una Supabase Function o un endpoint
  return { success: true, message: 'Report generation started.' };
};

// Placeholder para subir un PDF
export const uploadPdf = async (userId, file) => {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const filePath = `${userId}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('documents') // Nombre del bucket en Supabase
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
  return data;
};

// Placeholder para descargar un PDF
export const downloadPdf = async (filePath) => {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.storage
    .from('documents') // Nombre del bucket en Supabase
    .download(filePath);

  if (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
  return data; // Esto será un Blob
};

// Pagos deshabilitados. Stub temporal para Mercado Pago.
export const createPaymentIntent = async () => {
  return { clientSecret: null, message: 'Pasarela de pago en migración. Mercado Pago próximamente.' };
};