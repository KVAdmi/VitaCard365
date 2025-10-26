# Plan de recuperación y estabilidad para VitaCard365 (24/10/2025)

## 1. Congelar versión de Node
- Crear o actualizar `.nvmrc` en la raíz con:
  ```
  20.11.1
  ```
- En terminal:
  ```
  nvm install 20.11.1
  nvm use 20.11.1
  node -v    # debe decir v20.11.1
  ```
- Si no usas nvm, al menos confirma `node -v = 20.11.1` antes de instalar.

## 2. Reinstalación limpia
- Desde la raíz del proyecto:
  ```
  rm -rf node_modules package-lock.json
  npm cache verify
  npm i
  npm rebuild esbuild
  node -e "console.log('esbuild', require('esbuild').version)"
  ```
- Si el último comando truena:
  ```
  npm i -D esbuild@latest
  npm rebuild esbuild
  ```

## 3. Smoke test de Android
- Build web + copiar a Android y verificar assets:
  ```
  npm run build:mobile
  npx cap sync android
  cd android && ./gradlew clean assembleDebug
  ```
- Si termina en BUILD SUCCESSFUL, Android quedó sano.

## 4. Commit
  ```
  git add -A
  git commit -m "Fix: clean install, lock Node 20.11.1, rebuild esbuild"
  git push
  ```

## 5. iOS (en rama separada)
- Cuando quieras encender iOS sin tocar main:
  ```
  git checkout -b ios-cap7
  npm pkg set "@capacitor/core@7.4.3" "@capacitor/cli@7.4.3"
  npm i
  npx cap update ios
  cd ios && pod install --repo-update && cd ..
  npx cap open ios
  git add -A
  git commit -m "iOS: pods installed & Capacitor 7.x aligned"
  git push -u origin ios-cap7
  ```
- En Codemagic, selecciona Branch = ios-cap7 y revisa codemagic.yaml para no escapar variables con $.

## Notas
- Capacitor y plugins están alineados a 7.x para Android.
- El problema actual es binarios nativos y .bin faltantes por cambios de Node/arquitectura.
- Reinstalar con Node 20.11.1 y rebuild soluciona.
- Android estable, iOS se ajusta en rama aparte.

---

Este plan deja Android estable y el carril listo para iOS sin riesgos para producción.