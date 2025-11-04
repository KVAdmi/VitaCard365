import { createPortal } from "react-dom";

// Verify portal exists or create it
function getPortalRoot() {
  let portalRoot = document.getElementById('top-portal');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'top-portal';
    portalRoot.className = 'layer-portal';
    document.body.appendChild(portalRoot);
  }
  return portalRoot;
}

export default function TopPortal({ children }: { children: React.ReactNode }) {
  const portalRoot = getPortalRoot();
  return createPortal(children, portalRoot);
}