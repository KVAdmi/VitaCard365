
import type { PermissionGateStatus } from './PermissionGate.types';

// Versión mínima: solo chequea permisos y renderiza hijos si están OK
export default function PermissionGate({ children }: { children: (status: PermissionGateStatus, actions: any) => React.ReactNode }) {
  // Aquí solo deberías tener la lógica mínima para pasar el control si los permisos están OK
  // Puedes agregar tu lógica de chequeo de permisos aquí, pero sin UI extra ni botones
  // Por defecto, simplemente renderiza los hijos
  return children({ location: true, bluetooth: true, nearby: true, sdkLevel: 30 }, {});
}
