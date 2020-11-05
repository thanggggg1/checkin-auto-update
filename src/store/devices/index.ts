import { createDynamicReducer } from "../../utils/createDynamicReducer";
import { useSelector } from "react-redux";

export enum DeviceSyncMethod {
  PY = "pyatt",
  LARGE_DATASET = "large_dataset",
  LEGACY = "legacy",
}

export interface Device {
  ip: string;
  name: string;
  port: number;
  connection: "tcp" | "udp";
  inport?: number;
  timeout?: number;
  heartbeat?: number;
  autoReconnect?: number;
  syncMethod?: DeviceSyncMethod;
}

export const {
  reducer: devicesReducer,
  setStore: setDevicesStore,
  sync: syncDevices,
  multiDelete: deleteDevices,
} = createDynamicReducer<Device>("devices", "ip", {
  byKey: {},
  query: {},
});

const devicesSelector = (state: any) => state.devices.byKey;
export const useDevicesRecord = (): Record<string, Device> => {
  return useSelector(devicesSelector);
};

export const useDeviceSyncMethod = (device: Device): DeviceSyncMethod => {
  if (
    !device.syncMethod ||
    !Object.values(DeviceSyncMethod).includes(device.syncMethod)
  ) {
    return DeviceSyncMethod.LARGE_DATASET;
  }

  return device.syncMethod;
};
