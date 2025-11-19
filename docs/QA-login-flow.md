# QA Login Flow VitaCard365

## Pasos
1. Acceder /login sin sesión: ver formulario.
2. Ingresar credenciales válidas: botón muestra “Iniciando sesión…” y redirige a /dashboard.
3. Recargar /dashboard: mantiene sesión.
4. Intentar acceder a /dashboard sin sesión: redirige a /login.
5. Intentar acceder a /mi-plan sin acceso activo: redirige correctamente.
6. Probar login fallido: muestra error claro.
7. Probar persistencia tras recargar navegador.
8. Revisar logs en consola si DEBUG_AUTH=true.

## Checks
- getSession devuelve session tras login.
- user se mantiene tras reload.
- Perfil se crea si faltaba.
- ProtectedRoute no rebota con user válido.
- Acceso inactivo redirige correctamente a /mi-plan.
- Solo una instancia de supabaseClient.
- Policies RLS listas (si se activan).
- DEBUG_AUTH=false en producción.
