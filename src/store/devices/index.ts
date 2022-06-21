import { createDynamicReducer } from "../../utils/createDynamicReducer";
import { useSelector } from "react-redux";

export enum DeviceSyncMethod {
  PY = "pyatt",
  LARGE_DATASET = "large_dataset",
  LEGACY = "legacy",
}

export interface Device {
  syncMethod?: void;
  name: string;
  timeout?: number;
  heartbeat?: number;
  autoReconnect?: number;
  ip?:number;

  domain: string; // key
  username: string;
  password: string;
  token: string;

  clientToken: string;
  clientPassword: string;

  sessionId?: string;
  syncTime?: number
  startSync?:number
  lastSync?: number
  syncing?: boolean
  doors?: string // BR-ACS-1F-02, BR-ACS-1F-09...
  status: "Online" | "Offline"
}

export const {
  reducer: devicesReducer,
  setStore: setDevicesStore,
  sync: syncDevices,
  multiDelete: deleteDevices,
  reset:resetDevices
} = createDynamicReducer<Device>("devices", "domain", {
  byKey: {},
  query: {}
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
