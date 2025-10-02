export type LEDevice = {
  deviceId: string;
  name?: string;
  uuids?: string[];
  rssi?: number;
};

export type LEScanResult = {
  device: LEDevice;
};

export type LENotification = {
  value?: ArrayBuffer;
  characteristic?: string;
  service?: string;
  deviceId?: string;
};
