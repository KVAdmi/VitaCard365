export type PermissionGateStatus = {
  location: boolean;
  bluetooth: boolean;
  nearby: boolean | null; // null si no aplica
  sdkLevel: number | null;
};
