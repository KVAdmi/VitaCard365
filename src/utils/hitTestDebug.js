// Utilidades simples para depurar hit-testing en WebView (DEV only)
export function hitTestCheck(x = 0, y = 0) {
  try {
    const el = document.elementFromPoint(x, y);
    return el;
  } catch {
    return null;
  }
}

export function hitTestListFixed() {
  try {
    const nodes = Array.from(document.querySelectorAll('*'));
    const fixed = nodes.filter(el => getComputedStyle(el).position === 'fixed');
    return fixed.map(el => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        el,
        tag: el.tagName.toLowerCase(),
        class: el.className,
        id: el.id,
        zIndex: cs.zIndex,
        pointerEvents: cs.pointerEvents,
        opacity: cs.opacity,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      };
    });
  } catch {
    return [];
  }
}

export function enableHitTestDebug() {
  // Exponer helpers en window para inspección por consola
  try {
    // @ts-ignore
    window.__hitTest = {
      check: hitTestCheck,
      listFixed: hitTestListFixed,
    };
    // Añadir borde al hacer clic con ALT para ver qué elemento recibe el toque
    const highlight = (ev) => {
      try {
        if (!ev.altKey) return;
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        if (!el) return;
        const prev = document.querySelector('[data-hittest-highlight]');
        if (prev) prev.removeAttribute('data-hittest-highlight');
        el.setAttribute('data-hittest-highlight', '');
      } catch {}
    };
    document.addEventListener('click', highlight, true);
    const style = document.createElement('style');
    style.textContent = `[data-hittest-highlight]{ outline: 2px dashed #f06340 !important; outline-offset: 2px !important; }`;
    document.head.appendChild(style);
    // eslint-disable-next-line no-console
    console.log('[hitTestDebug] Habilitado. window.__hitTest.check(x,y), window.__hitTest.listFixed()');
  } catch {}
}
