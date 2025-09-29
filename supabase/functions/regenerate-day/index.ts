import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegenerateDayRequest {
  userId: string;
  semana: number;
  dia: number;
  minutos?: number;
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
    const body: RegenerateDayRequest = await req.json();
    const { userId, semana, dia, minutos = 25 } = body;

    // Validate required fields
    if (!userId || !semana || !dia) {
      return new Response(
        JSON.stringify({ code: 400, message: 'Missing required fields: userId, semana, dia' }),
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
    console.log(`[${requestId}] Regenerating day for user ${userId}: week ${semana}, day ${dia}`);

    // Get user's active plan
    const { data: activePlan, error: planError } = await supabase
      .from('planes')
      .select('*')
      .eq('user_id', userId)
      .eq('estado', 'activo')
      .single();

    if (planError || !activePlan) {
      return new Response(
        JSON.stringify({ 
          code: 'NO_PLAN', 
          message: 'No active plan found for user',
          requestId 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing routine exercises for this day
    const { data: existingRoutine } = await supabase
      .from('rutinas')
      .select('id')
      .eq('user_id', userId)
      .eq('semana', semana)
      .eq('dia', dia)
      .single();

    if (existingRoutine) {
      // Delete routine exercises
      await supabase
        .from('rutina_ejercicios')
        .delete()
        .eq('rutina_id', existingRoutine.id);

      // Delete daily routine
      await supabase
        .from('rutina_diaria')
        .delete()
        .eq('rutina_id', existingRoutine.id);

      // Delete routine
      await supabase
        .from('rutinas')
        .delete()
        .eq('id', existingRoutine.id);

      console.log(`[${requestId}] Deleted existing routine ${existingRoutine.id}`);
    }

    // Get exercises for regeneration
    const { data: ejercicios, error: exerciseError } = await supabase
      .from('ejercicios')
      .select('*')
      .limit(20);

    if (exerciseError || !ejercicios || ejercicios.length === 0) {
      console.error(`[${requestId}] Error fetching exercises:`, exerciseError);
      return new Response(
        JSON.stringify({ 
          code: 'DB_ERROR', 
          message: 'Failed to fetch exercises',
          details: exerciseError?.message,
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Shuffle exercises for variety
    const shuffledExercises = ejercicios.sort(() => Math.random() - 0.5);
    const targetExercises = Math.min(Math.floor(minutos / 5), shuffledExercises.length, 6);
    const selectedExercises = shuffledExercises.slice(0, targetExercises);

    const now = new Date();

    // Create new routine
    const { data: newRoutine, error: routineError } = await supabase
      .from('rutinas')
      .insert({
        user_id: userId,
        plan_id: activePlan.id,
        semana: semana,
        dia: dia,
        foco: activePlan.objetivo,
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

    console.log(`[${requestId}] Created new routine ${newRoutine.id}`);

    // Create routine exercises
    const rutinaEjercicios = selectedExercises.map((ejercicio, index) => ({
      rutina_id: newRoutine.id,
      ejercicio_id: ejercicio.id,
      orden: index + 1,
      series: 3,
      reps: activePlan.objetivo === 'fuerza' ? 8 : 12,
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
