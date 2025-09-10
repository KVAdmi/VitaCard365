# Este archivo garantiza que las variables de entorno estén configuradas correctamente
# para el funcionamiento de la aplicación con Supabase y Mercado Pago.

import sys
import os
from urllib.parse import urlparse
import requests
import re
import time

GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
END = '\033[0m'

def print_colored(text, color):
    print(f"{color}{text}{END}")

print_colored("=== VitaCard365 - Verificador de Configuración ===", GREEN)
print("")

# Verificar archivo .env
env_path = ".env"
if not os.path.exists(env_path):
    print_colored("❌ Error: No se encontró el archivo .env", RED)
    print("Creando archivo .env básico...")
    with open(env_path, "w") as f:
        f.write("""
# Supabase (autenticación)
VITE_SUPABASE_URL=https://ymwhgkeomyuevsckljdw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2hna2VvbXl1ZXZzY2tsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTg1NTEsImV4cCI6MjA3MjQzNDU1MX0.MGrQkn4-XQFCWD-RrKjLnAIQQNFvr8eVO8HeOfpWW7o

# Configuración para desarrollo local con Mercado Pago en AWS
PUBLIC_URL=http://localhost:5173
VITE_API_BASE_URL=http://54.175.250.15:3000
VITE_ENABLE_MP=true
VITE_MP_PUBLIC_KEY=TEST-026aac38-9a53-4f99-9600-0714f2c2258f
""")
    print_colored("✅ Archivo .env creado correctamente", GREEN)
else:
    print_colored("✅ Archivo .env encontrado", GREEN)

# Leer variables de entorno
with open(env_path, "r") as f:
    env_content = f.read()

# Verificar variables de Supabase
supabase_url_match = re.search(r'VITE_SUPABASE_URL=(.+)', env_content)
supabase_key_match = re.search(r'VITE_SUPABASE_ANON_KEY=(.+)', env_content)

if not supabase_url_match:
    print_colored("❌ No se encontró VITE_SUPABASE_URL en el archivo .env", RED)
else:
    supabase_url = supabase_url_match.group(1).strip()
    print_colored(f"✅ VITE_SUPABASE_URL: {supabase_url}", GREEN)

if not supabase_key_match:
    print_colored("❌ No se encontró VITE_SUPABASE_ANON_KEY en el archivo .env", RED)
else:
    supabase_key = supabase_key_match.group(1).strip()
    key_preview = f"{supabase_key[:20]}...{supabase_key[-5:]}" if len(supabase_key) > 30 else supabase_key
    print_colored(f"✅ VITE_SUPABASE_ANON_KEY: {key_preview}", GREEN)

# Verificar variables de Mercado Pago
mp_api_match = re.search(r'VITE_API_BASE_URL=(.+)', env_content)
mp_enabled_match = re.search(r'VITE_ENABLE_MP=(.+)', env_content)
mp_key_match = re.search(r'VITE_MP_PUBLIC_KEY=(.+)', env_content)

if not mp_api_match:
    print_colored("❌ No se encontró VITE_API_BASE_URL en el archivo .env", RED)
else:
    mp_api = mp_api_match.group(1).strip()
    print_colored(f"✅ VITE_API_BASE_URL: {mp_api}", GREEN)

if not mp_enabled_match:
    print_colored("❌ No se encontró VITE_ENABLE_MP en el archivo .env", RED)
else:
    mp_enabled = mp_enabled_match.group(1).strip()
    print_colored(f"✅ VITE_ENABLE_MP: {mp_enabled}", GREEN)

if not mp_key_match:
    print_colored("❌ No se encontró VITE_MP_PUBLIC_KEY en el archivo .env", RED)
else:
    mp_key = mp_key_match.group(1).strip()
    print_colored(f"✅ VITE_MP_PUBLIC_KEY: {mp_key}", GREEN)

# Verificar conexión a Supabase
print("\nVerificando conexión a Supabase...")
if supabase_url_match:
    try:
        parsed_url = urlparse(supabase_url)
        health_url = f"{parsed_url.scheme}://{parsed_url.netloc}/rest/v1/"
        headers = {"apikey": supabase_key if supabase_key_match else ""}
        
        response = requests.head(health_url, headers=headers, timeout=5)
        if response.status_code < 400:
            print_colored(f"✅ Conexión exitosa a Supabase ({response.status_code})", GREEN)
        else:
            print_colored(f"❌ Error al conectar a Supabase: HTTP {response.status_code}", RED)
    except Exception as e:
        print_colored(f"❌ Error al conectar a Supabase: {str(e)}", RED)

# Verificar conexión a Mercado Pago
print("\nVerificando conexión al servidor de Mercado Pago...")
if mp_api_match:
    try:
        health_url = f"{mp_api.rstrip('/')}/health"
        response = requests.get(health_url, timeout=5)
        if response.status_code == 200:
            print_colored(f"✅ Conexión exitosa al servidor de MP ({response.status_code})", GREEN)
            print(f"Respuesta: {response.text[:100]}...")
        else:
            print_colored(f"❌ Error al conectar al servidor de MP: HTTP {response.status_code}", RED)
    except Exception as e:
        print_colored(f"❌ Error al conectar al servidor de MP: {str(e)}", RED)
        print_colored("⚠️ El servidor de Mercado Pago en AWS podría no estar funcionando", YELLOW)
        print_colored("   Verifica que el servidor esté en ejecución en la instancia EC2", YELLOW)

print("\nInstrucciones para iniciar el desarrollo:")
print_colored("1. Detén cualquier servidor en ejecución (Ctrl+C)", YELLOW)
print_colored("2. Ejecuta el siguiente comando:", YELLOW)
print_colored("   npm run dev", GREEN)
print_colored("3. Una vez iniciado, abre http://localhost:5173 en tu navegador", YELLOW)
print("")
print_colored("Si continúas teniendo problemas:", YELLOW)
print("- Verifica que el servidor de Mercado Pago esté funcionando en AWS")
print("- Comprueba que las credenciales de Supabase sean correctas")
print("- Asegúrate de que los puertos necesarios estén abiertos")