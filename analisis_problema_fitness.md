# Análisis del Problema: Función generate-plan no inserta ejercicios

## Resumen del Problema

La función `generate-plan` se ejecuta sin errores pero no inserta registros en las tablas `rutina_ejercicios` ni `rutina_diaria`, resultando en rutinas vacías en la aplicación.

## Hallazgos del Análisis

### 1. Estructura del Frontend (CrearRutina.tsx)

- **Llamada a la función**: `${VITE_SUPABASE_URL}/functions/v1/generate-plan`
- **Payload enviado**: `{ userId: session.user.id, ...payload }`
- **Respuesta esperada**: `{ ok: true, createdCount: number, requestId?: string }`
- **Vista consultada**: `v_rutina_detalle` para mostrar ejercicios

### 2. Tablas Involucradas

Según el código, las tablas principales son:
- `planes` - Planes de entrenamiento del usuario
- `rutinas` - Rutinas diarias base
- `rutina_ejercicios` - Ejercicios asignados a rutinas
- `rutina_diaria` - Rutinas específicas por día
- `ejercicios` - Catálogo de ejercicios disponibles
- `v_rutina_detalle` - Vista que une todas las tablas para mostrar la rutina completa

### 3. Función Edge generate-plan

**PROBLEMA IDENTIFICADO**: La función `generate-plan` NO se encuentra en el repositorio local.

Esto indica que:
- La función está desplegada directamente en Supabase
- Podría estar en un repositorio separado
- Podría haber sido eliminada accidentalmente del código fuente

### 4. Flujo de Datos Esperado

1. Usuario completa el formulario de objetivos (GoalTest)
2. Frontend llama a `generate-plan` con parámetros del usuario
3. Función debería:
   - Consultar tabla `ejercicios` según criterios
   - Crear registros en `rutinas`
   - Crear registros en `rutina_ejercicios`
   - Crear registros en `rutina_diaria`
4. Frontend consulta `v_rutina_detalle` para mostrar resultados

### 5. Síntomas Observados

- `createdCount: 0` en la respuesta
- Vista `v_rutina_detalle` vacía
- No hay errores reportados en la función
- La tabla `ejercicios` está poblada correctamente

## Diagnóstico Preliminar

### Posibles Causas

1. **Función Edge faltante o corrupta**
   - La función no existe en Supabase
   - La función existe pero tiene errores de lógica
   - La función no tiene permisos para insertar datos

2. **Problemas de Base de Datos**
   - Restricciones de claves foráneas
   - Políticas RLS (Row Level Security) bloqueando inserciones
   - Triggers que fallan silenciosamente

3. **Problemas de Datos**
   - Consulta de ejercicios no retorna resultados
   - Parámetros de entrada inválidos
   - Formato de datos incorrecto

## Próximos Pasos Recomendados

1. **Verificar existencia de la función Edge**
2. **Revisar la implementación de la función generate-plan**
3. **Validar estructura de tablas y relaciones**
4. **Probar consultas de ejercicios manualmente**
5. **Verificar políticas RLS y permisos**
6. **Implementar logging detallado en la función**

## Archivos Clave Identificados

- `src/pages/CrearRutina.tsx` - Frontend principal
- `src/components/rutina/GoalTest.tsx` - Formulario de objetivos
- `supabase/migrations/` - Migraciones de base de datos
- Función Edge `generate-plan` - **FALTANTE**
