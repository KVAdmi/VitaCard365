import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePlanRequest {
  userId: string;
  objetivo: string;
  nivel?: string;
  minutos?: number;
  diasSemana?: number;
  equipo?: string[];
  limitaciones?: string[];
}

interface Ejercicio {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  nivel_base: number;
  equipo: string[];
  cues: string[];
  contraindicaciones: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 401, message: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ code: 401, message: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: GeneratePlanRequest = await req.json();
    const { userId, objetivo, nivel = 'principiante', minutos = 25, diasSemana = 3, equipo = [], limitaciones = [] } = body;

    // Validate required fields
    if (!userId || !objetivo) {
      return new Response(
        JSON.stringify({ code: 400, message: 'Missing required fields: userId, objetivo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user matches authenticated user
    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ code: 403, message: 'User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Generating plan for user ${userId}: ${objetivo}, ${minutos}min, ${diasSemana} days`);

    // Check if user already has an active plan
    const { data: existingPlan } = await supabase
      .from('planes')
      .select('id')
      .eq('user_id', userId)
      .eq('estado', 'activo')
      .single();

    if (existingPlan) {
      return new Response(
        JSON.stringify({ 
          code: 'CONFLICT', 
          message: 'User already has an active plan',
          routine_id: existingPlan.id,
          requestId 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current week and day
    const now = new Date();
    const semanaActual = 1; // For simplicity, always week 1
    const diaHoy = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday=0 to Sunday=7

    // Check if routine already exists for today
    const { data: existingRoutine } = await supabase
      .from('rutinas')
      .select('id')
      .eq('user_id', userId)
      .eq('semana', semanaActual)
      .eq('dia', diaHoy)
      .single();

    if (existingRoutine) {
      return new Response(
        JSON.stringify({ 
          code: 'CONFLICT', 
          message: 'Routine already exists for today',
          routine_id: existingRoutine.id,
          requestId 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new plan
    const { data: newPlan, error: planError } = await supabase
      .from('planes')
      .insert({
        user_id: userId,
        objetivo,
        nivel,
        dias_semana: diasSemana,
        minutos_sesion: minutos,
        estado: 'activo',
        created_at: now.toISOString()
      })
      .select('id')
      .single();

    if (planError) {
      console.error(`[${requestId}] Error creating plan:`, planError);
      return new Response(
        JSON.stringify({ 
          code: 'DB_ERROR', 
          message: 'Failed to create plan',
          details: planError.message,
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Created plan ${newPlan.id}`);

    // Get exercises based on criteria
    let exerciseQuery = supabase
      .from('ejercicios')
      .select('*');

    // Filter by equipment if specified
    if (equipo.length > 0) {
      exerciseQuery = exerciseQuery.overlaps('equipo', equipo);
    }

    // Filter out contraindications
    if (limitaciones.length > 0) {
      exerciseQuery = exerciseQuery.not('contraindicaciones', 'cs', `{${limitaciones.join(',')}}`);
    }

    const { data: ejercicios, error: exerciseError } = await exerciseQuery.limit(20);

    if (exerciseError) {
      console.error(`[${requestId}] Error fetching exercises:`, exerciseError);
      return new Response(
        JSON.stringify({ 
          code: 'DB_ERROR', 
          message: 'Failed to fetch exercises',
          details: exerciseError.message,
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ejercicios || ejercicios.length === 0) {
      console.log(`[${requestId}] No exercises found for criteria`);
      return new Response(
        JSON.stringify({ 
          ok: true, 
          createdCount: 0,
          message: 'No exercises found for the specified criteria',
          requestId 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Found ${ejercicios.length} exercises`);

    // Select exercises for the routine (aim for 4-6 exercises based on time)
    const targetExercises = Math.min(Math.floor(minutos / 5), ejercicios.length, 6);
    const selectedExercises = ejercicios.slice(0, targetExercises);

    // Create routine for today
    const { data: newRoutine, error: routineError } = await supabase
      .from('rutinas')
      .insert({
        user_id: userId,
        plan_id: newPlan.id,
        semana: semanaActual,
        dia: diaHoy,
        foco: objetivo,
        minutos: minutos,
        estado: 'pendiente',
        created_at: now.toISOString()
      })
      .select('id')
      .single();

    if (routineError) {
      console.error(`[${requestId}] Error creating routine:`, routineError);
      return new Response(
        JSON.stringify({ 
          code: 'DB_ERROR', 
          message: 'Failed to create routine',
          details: routineError.message,
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Created routine ${newRoutine.id}`);

    // Create routine exercises
    const rutinaEjercicios = selectedExercises.map((ejercicio, index) => ({
      rutina_id: newRoutine.id,
      ejercicio_id: ejercicio.id,
      orden: index + 1,
      series: 3,
      reps: objetivo === 'fuerza' ? 8 : 12,
      tiempo_seg: ejercicio.categoria === 'cardio' ? 30 : null,
      descanso_seg: 60,
      rpe: 7,
      created_at: now.toISOString()
    }));

    const { data: insertedExercises, error: exerciseInsertError } = await supabase
      .from('rutina_ejercicios')
      .insert(rutinaEjercicios)
      .select('id');

    if (exerciseInsertError) {
      console.error(`[${requestId}] Error inserting routine exercises:`, exerciseInsertError);
      return new Response(
        JSON.stringify({ 
          code: 'DB_ERROR', 
          message: 'Failed to insert routine exercises',
          details: exerciseInsertError.message,
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const createdCount = insertedExercises?.length || 0;
    console.log(`[${requestId}] Created ${createdCount} routine exercises`);

    // Create daily routine entry
    const { error: dailyRoutineError } = await supabase
      .from('rutina_diaria')
      .insert({
        user_id: userId,
        rutina_id: newRoutine.id,
        fecha: now.toISOString().split('T')[0],
        completada: false,
        created_at: now.toISOString()
      });

    if (dailyRoutineError) {
      console.error(`[${requestId}] Error creating daily routine:`, dailyRoutineError);
      // Don't fail the whole operation for this
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        createdCount,
        routine_id: newRoutine.id,
        plan_id: newPlan.id,
        exercises: selectedExercises.length,
        requestId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        code: 'INTERNAL_ERROR', 
        message: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
