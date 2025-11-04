/**
 * Script de diagnóstico para identificar overlays que bloquean taps en iOS
 * VitaCard365 - Utilidad de debugging
 * 
 * Uso en Safari Web Inspector:
 * 1. Conectar dispositivo iOS
 * 2. Abrir Web Inspector
 * 3. En consola: diagnoseOverlays()
 */

export function diagnoseOverlays() {
  console.group('🔍 DIAGNÓSTICO DE OVERLAYS - VitaCard365');
  
  // 1. Listar todos los elementos fixed en zona superior
  const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const computed = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      computed.position === 'fixed' &&
      rect.top < 100 &&
      rect.width > window.innerWidth * 0.5 // Al menos 50% del ancho
    );
  });
  
  console.log(`📌 Elementos FIXED en zona superior (${fixedElements.length}):`);
  fixedElements.forEach((el, i) => {
    const computed = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const hasBackdrop = computed.backdropFilter !== 'none' && computed.backdropFilter !== '';
    console.log(`  [${i + 1}] ${el.tagName}${el.id ? '#' + el.id : ''}`, {
      element: el,
      classes: el.className,
      zIndex: computed.zIndex,
      pointerEvents: computed.pointerEvents,
      backdropFilter: computed.backdropFilter,
      transform: computed.transform,
      willChange: computed.willChange,
      dimensions: { 
        width: Math.round(rect.width), 
        height: Math.round(rect.height), 
        top: Math.round(rect.top) 
      },
      warning: hasBackdrop ? '⚠️ TIENE BACKDROP-FILTER' : ''
    });
  });
  
  // 2. Verificar elementos con z-index alto
  const highZIndex = Array.from(document.querySelectorAll('*')).filter(el => {
    const computed = window.getComputedStyle(el);
    const z = parseInt(computed.zIndex);
    return !isNaN(z) && z > 900;
  }).sort((a, b) => {
    const zA = parseInt(window.getComputedStyle(a).zIndex);
    const zB = parseInt(window.getComputedStyle(b).zIndex);
    return zB - zA; // Mayor a menor
  });
  
  console.log(`\n🔢 Elementos con z-index > 900 (${highZIndex.length}):`);
  highZIndex.forEach((el, i) => {
    const computed = window.getComputedStyle(el);
    const hasBackdrop = computed.backdropFilter !== 'none' && computed.backdropFilter !== '';
    console.log(`  [${i + 1}] z=${computed.zIndex} ${el.tagName}${el.id ? '#' + el.id : ''}`, {
      element: el,
      position: computed.position,
      pointerEvents: computed.pointerEvents,
      backdropFilter: computed.backdropFilter,
      warning: hasBackdrop ? '⚠️ BACKDROP + HIGH Z-INDEX' : ''
    });
  });
  
  // 3. Verificar elementos con backdrop-filter
  const withBackdrop = Array.from(document.querySelectorAll('*')).filter(el => {
    const computed = window.getComputedStyle(el);
    return computed.backdropFilter !== 'none' && computed.backdropFilter !== '';
  });
  
  console.log(`\n🌫️ Elementos con backdrop-filter (${withBackdrop.length}):`);
  withBackdrop.forEach((el, i) => {
    const computed = window.getComputedStyle(el);
    const isFixed = computed.position === 'fixed';
    const hasPointerEvents = computed.pointerEvents !== 'none';
    console.log(`  [${i + 1}] ${el.tagName}${el.id ? '#' + el.id : ''}`, {
      element: el,
      backdropFilter: computed.backdropFilter,
      position: computed.position,
      zIndex: computed.zIndex,
      pointerEvents: computed.pointerEvents,
      warning: (isFixed && hasPointerEvents) ? '🔴 FIXED + BACKDROP + POINTER-EVENTS (BUG!)' : ''
    });
  });
  
  // 4. Test de hit-testing en puntos clave
  const testPoints = [
    { x: 50, y: 30, desc: 'Botón back (izquierda)' },
    { x: window.innerWidth - 100, y: 30, desc: 'Botón campana (derecha)' },
    { x: window.innerWidth - 50, y: 30, desc: 'Avatar (extremo derecha)' },
    { x: window.innerWidth / 2, y: 30, desc: 'Centro del header' },
    { x: window.innerWidth - 80, y: 20, desc: 'Zona "Omitir" (Intro)' }
  ];
  
  console.log('\n🎯 Test de hit-testing en puntos clave:');
  testPoints.forEach(point => {
    const el = document.elementFromPoint(point.x, point.y);
    const computed = el ? window.getComputedStyle(el) : null;
    const isInteractive = el?.tagName === 'BUTTON' || 
                          el?.tagName === 'A' || 
                          el?.onclick !== null ||
                          el?.getAttribute('role') === 'button';
    const shouldBeInteractive = point.desc.includes('Botón') || point.desc.includes('Avatar');
    
    console.log(`  ${point.desc} (${point.x}, ${point.y}):`, {
      element: el,
      tag: el?.tagName,
      id: el?.id || '(sin id)',
      classes: el?.className?.substring(0, 50) + (el?.className?.length > 50 ? '...' : ''),
      pointerEvents: computed?.pointerEvents,
      isInteractive,
      warning: (shouldBeInteractive && !isInteractive) ? '❌ DEBERÍA SER INTERACTIVO' : ''
    });
  });
  
  // 5. Verificar stacking contexts problemáticos
  console.log('\n📚 Elementos que crean stacking context:');
  const stackingContexts = Array.from(document.querySelectorAll('*')).filter(el => {
    const computed = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return rect.top < 100 && (
      computed.transform !== 'none' ||
      computed.filter !== 'none' ||
      computed.willChange !== 'auto' ||
      computed.backdropFilter !== 'none' ||
      (computed.position !== 'static' && computed.zIndex !== 'auto')
    );
  });
  
  stackingContexts.forEach((el, i) => {
    const computed = window.getComputedStyle(el);
    const reasons = [];
    if (computed.transform !== 'none') reasons.push('transform');
    if (computed.filter !== 'none') reasons.push('filter');
    if (computed.willChange !== 'auto') reasons.push('will-change');
    if (computed.backdropFilter !== 'none') reasons.push('backdrop-filter');
    if (computed.position !== 'static' && computed.zIndex !== 'auto') reasons.push('position+z-index');
    
    console.log(`  [${i + 1}] ${el.tagName}${el.id ? '#' + el.id : ''}`, {
      element: el,
      reasons: reasons.join(', '),
      zIndex: computed.zIndex
    });
  });
  
  // 6. Resumen y recomendaciones
  console.log('\n📊 RESUMEN:');
  const criticalIssues = withBackdrop.filter(el => {
    const computed = window.getComputedStyle(el);
    return computed.position === 'fixed' && computed.pointerEvents !== 'none';
  });
  
  if (criticalIssues.length > 0) {
    console.warn(`⚠️ ${criticalIssues.length} elemento(s) con backdrop-filter + fixed + pointer-events`);
    console.warn('   Esto causa el bug de hit-testing en iOS WKWebView');
    console.log('   Elementos afectados:', criticalIssues);
  } else {
    console.log('✅ No se detectaron combinaciones críticas de backdrop-filter + fixed');
  }
  
  console.groupEnd();
  
  return {
    fixedElements,
    highZIndex,
    withBackdrop,
    criticalIssues,
    testPoints: testPoints.map(p => ({
      ...p,
      element: document.elementFromPoint(p.x, p.y)
    }))
  };
}

/**
 * Test rápido de hit-testing en un punto específico
 */
export function hitTestPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) {
    console.log(`❌ No se encontró elemento en (${x}, ${y})`);
    return null;
  }
  
  const computed = window.getComputedStyle(el);
  console.group(`🎯 Hit-test en (${x}, ${y})`);
  console.log('Elemento:', el);
  console.log('Tag:', el.tagName);
  console.log('ID:', el.id || '(sin id)');
  console.log('Classes:', el.className);
  console.log('Computed styles:', {
    position: computed.position,
    zIndex: computed.zIndex,
    pointerEvents: computed.pointerEvents,
    backdropFilter: computed.backdropFilter,
    transform: computed.transform,
    willChange: computed.willChange
  });
  
  // Verificar árbol de padres
  console.log('Árbol de padres:');
  let current = el;
  let depth = 0;
  while (current && depth < 5) {
    const parentComputed = window.getComputedStyle(current);
    const hasBackdrop = parentComputed.backdropFilter !== 'none' && parentComputed.backdropFilter !== '';
    console.log(`  ${'  '.repeat(depth)}↳ ${current.tagName}${current.id ? '#' + current.id : ''}`, {
      position: parentComputed.position,
      zIndex: parentComputed.zIndex,
      backdropFilter: hasBackdrop ? parentComputed.backdropFilter : 'none'
    });
    current = current.parentElement;
    depth++;
  }
  
  console.groupEnd();
  return el;
}

/**
 * Agregar overlay visual temporal para debugging
 */
export function showHitTestOverlay() {
  // Remover overlay anterior si existe
  const existing = document.getElementById('hit-test-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'hit-test-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: rgba(255, 0, 0, 0.1);
    border-bottom: 2px dashed red;
    z-index: 999999;
    pointer-events: none;
    font-family: monospace;
    font-size: 11px;
    color: white;
    padding: 5px;
    text-shadow: 0 0 3px black;
  `;
  overlay.innerHTML = `
    <div style="background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; display: inline-block;">
      🔍 Hit-Test Debug Zone (0-80px)<br>
      Tap para ver elemento en consola
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Interceptar toques y mostrar en consola
  document.addEventListener('touchstart', function logTouch(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    if (y < 80) {
      console.log(`👆 Tap en (${Math.round(x)}, ${Math.round(y)})`);
      hitTestPoint(x, y);
    }
  }, { passive: true });
  
  console.log('✅ Overlay de debugging activado');
  console.log('   Toca en la zona roja para ver el elemento en consola');
  console.log('   Para remover: document.getElementById("hit-test-overlay").remove()');
}

// Exponer globalmente para uso en consola
if (typeof window !== 'undefined') {
  window.diagnoseOverlays = diagnoseOverlays;
  window.hitTestPoint = hitTestPoint;
  window.showHitTestOverlay = showHitTestOverlay;
  
  console.log('🛠️ Herramientas de debugging cargadas:');
  console.log('  - diagnoseOverlays(): Análisis completo de overlays');
  console.log('  - hitTestPoint(x, y): Test de hit-testing en punto específico');
  console.log('  - showHitTestOverlay(): Mostrar overlay visual de debugging');
}
