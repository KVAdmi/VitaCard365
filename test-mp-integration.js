#!/usr/bin/env node

/**
 * Script de verificación para la integración de Mercado Pago
 * Verifica que todas las correcciones estén funcionando correctamente
 */

import fs from 'fs';
import path from 'path';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, checks) {
  log(`\n📁 Verificando: ${filePath}`, 'blue');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Archivo no encontrado: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;
  
  checks.forEach(({ description, test, fix }) => {
    const passed = test(content);
    if (passed) {
      log(`✅ ${description}`, 'green');
    } else {
      log(`❌ ${description}`, 'red');
      if (fix) {
        log(`   💡 Solución: ${fix}`, 'yellow');
      }
      allPassed = false;
    }
  });
  
  return allPassed;
}

function main() {
  log('🔍 Verificando correcciones de Mercado Pago...', 'blue');
  
  const checks = [
    {
      file: 'src/components/payments/MPWallet.jsx',
      checks: [
        {
          description: 'Componente MPWallet corregido',
          test: (content) => content.includes('cleanupBrick') && content.includes('brickInstanceRef'),
          fix: 'Usar la versión corregida de MPWallet.jsx'
        },
        {
          description: 'Manejo de errores implementado',
          test: (content) => content.includes('setMpError') && content.includes('onError'),
          fix: 'Implementar manejo de errores en MPWallet'
        }
      ]
    },
    {
      file: 'src/lib/api.js',
      checks: [
        {
          description: 'Parámetros corregidos (unit_price)',
          test: (content) => content.includes('unit_price: amount'),
          fix: 'Cambiar "amount" por "unit_price" en el payload'
        },
        {
          description: 'Validación de monto implementada',
          test: (content) => content.includes('Number(payload.amount)'),
          fix: 'Implementar validación de monto'
        }
      ]
    },
    {
      file: 'server-mp.js',
      checks: [
        {
          description: 'Servidor usa parámetros dinámicos',
          test: (content) => !content.includes('amount=199') && content.includes('unit_price'),
          fix: 'Eliminar valores hardcodeados y usar unit_price del request'
        },
        {
          description: 'Logging mejorado implementado',
          test: (content) => content.includes('console.log') && content.includes('Datos recibidos'),
          fix: 'Implementar logging detallado'
        }
      ]
    },
    {
      file: 'src/pages/PaymentGateway.jsx',
      checks: [
        {
          description: 'Manejo de estados mejorado',
          test: (content) => content.includes('setError') && content.includes('setLoading'),
          fix: 'Implementar manejo de estados de loading y error'
        },
        {
          description: 'Validación de monto implementada',
          test: (content) => content.includes('parseFloat(totalAmount)'),
          fix: 'Validar monto antes de enviar'
        }
      ]
    }
  ];
  
  let allFilesOk = true;
  
  checks.forEach(({ file, checks: fileChecks }) => {
    const fileOk = checkFile(file, fileChecks);
    allFilesOk = allFilesOk && fileOk;
  });
  
  log('\n📋 Resumen de verificación:', 'blue');
  
  if (allFilesOk) {
    log('✅ Todas las correcciones están implementadas correctamente', 'green');
    log('\n🚀 Próximos pasos:', 'blue');
    log('1. Configurar variables de entorno (.env)', 'yellow');
    log('2. Instalar dependencias: npm install', 'yellow');
    log('3. Iniciar servidor backend: node server-mp.js', 'yellow');
    log('4. Iniciar frontend: npm run dev', 'yellow');
    log('5. Probar la pasarela de pago', 'yellow');
  } else {
    log('❌ Algunas correcciones faltan por implementar', 'red');
    log('Revisa los archivos marcados arriba', 'yellow');
  }
  
  // Verificar variables de entorno
  log('\n🔧 Verificando configuración de entorno:', 'blue');
  
  const envFiles = ['.env', '.env.local', '.env.fixed.new'];
  let envFound = false;
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      envFound = true;
      log(`✅ Encontrado: ${envFile}`, 'green');
      
      const envContent = fs.readFileSync(envFile, 'utf8');
      const hasPublicKey = envContent.includes('VITE_MP_PUBLIC_KEY');
      const hasAccessToken = envContent.includes('MP_ACCESS_TOKEN');
      
      if (hasPublicKey && hasAccessToken) {
        log('✅ Variables de MP configuradas', 'green');
      } else {
        log('⚠️  Faltan variables de MP', 'yellow');
      }
    }
  });
  
  if (!envFound) {
    log('❌ No se encontró archivo .env', 'red');
    log('💡 Copia .env.fixed.new a .env y configura las claves de MP', 'yellow');
  }
}

main();
