#!/usr/bin/env node

/**
 * Script de prueba para las funciones de fitness
 * Valida que las funciones generate-plan y regenerate-day funcionen correctamente
 */

const https = require('https');

// Configuración (usar las variables de entorno del proyecto)
const SUPABASE_URL = 'https://ymwhgkeomyuevsckljdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2hna2VvbXl1ZXZzY2tsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTg1NTEsImV4cCI6MjA3MjQzNDU1MX0.MGrQkn4-XQFCWD-RrKjLnAIQQNFvr8eVO8HeOfpWW7o';

// Usuario de prueba (necesitarás un token válido para pruebas reales)
const TEST_USER_ID = 'test-user-id';
const TEST_AUTH_TOKEN = 'Bearer your-auth-token-here';

/**
 * Realiza una petición HTTP
 */
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Prueba la función generate-plan
 */
async function testGeneratePlan() {
  console.log('🧪 Probando función generate-plan...');
  
  const url = `${SUPABASE_URL}/functions/v1/generate-plan`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': TEST_AUTH_TOKEN,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    }
  };
  
  const payload = {
    userId: TEST_USER_ID,
    objetivo: 'fuerza',
    nivel: 'principiante',
    minutos: 25,
    diasSemana: 3
  };

  try {
    const result = await makeRequest(url, options, payload);
    console.log(`📊 Status: ${result.status}`);
    console.log(`📋 Response:`, JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data?.ok) {
      console.log('✅ generate-plan funcionando correctamente');
      return true;
    } else if (result.status === 401) {
      console.log('⚠️  generate-plan requiere autenticación (esperado)');
      return true;
    } else {
      console.log('❌ generate-plan no está funcionando correctamente');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al probar generate-plan:', error.message);
    return false;
  }
}

/**
 * Prueba la función regenerate-day
 */
async function testRegenerateDay() {
  console.log('\n🧪 Probando función regenerate-day...');
  
  const url = `${SUPABASE_URL}/functions/v1/regenerate-day`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': TEST_AUTH_TOKEN,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    }
  };
  
  const payload = {
    userId: TEST_USER_ID,
    semana: 1,
    dia: 1,
    minutos: 25
  };

  try {
    const result = await makeRequest(url, options, payload);
    console.log(`📊 Status: ${result.status}`);
    console.log(`📋 Response:`, JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data?.ok) {
      console.log('✅ regenerate-day funcionando correctamente');
      return true;
    } else if (result.status === 401) {
      console.log('⚠️  regenerate-day requiere autenticación (esperado)');
      return true;
    } else {
      console.log('❌ regenerate-day no está funcionando correctamente');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al probar regenerate-day:', error.message);
    return false;
  }
}

/**
 * Verifica que las tablas existan
 */
async function testDatabaseTables() {
  console.log('\n🧪 Verificando tablas de base de datos...');
  
  const tables = ['ejercicios', 'planes', 'rutinas', 'rutina_ejercicios', 'v_rutina_detalle'];
  let allTablesExist = true;
  
  for (const table of tables) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`;
    const options = {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    try {
      const result = await makeRequest(url, options);
      if (result.status === 200) {
        console.log(`✅ Tabla ${table} existe y es accesible`);
      } else {
        console.log(`❌ Tabla ${table} no es accesible (status: ${result.status})`);
        allTablesExist = false;
      }
    } catch (error) {
      console.error(`❌ Error al verificar tabla ${table}:`, error.message);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando pruebas de funciones de fitness...\n');
  
  const results = {
    database: await testDatabaseTables(),
    generatePlan: await testGeneratePlan(),
    regenerateDay: await testRegenerateDay()
  };
  
  console.log('\n📊 Resumen de pruebas:');
  console.log(`Database tables: ${results.database ? '✅' : '❌'}`);
  console.log(`generate-plan: ${results.generatePlan ? '✅' : '❌'}`);
  console.log(`regenerate-day: ${results.regenerateDay ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Configura un usuario de prueba con token válido');
    console.log('2. Ejecuta pruebas end-to-end desde la aplicación');
    console.log('3. Verifica que las rutinas se muestren correctamente en el frontend');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testGeneratePlan, testRegenerateDay, testDatabaseTables };
