import { createDynamicReducer } from "../../utils/createDynamicReducer";

export interface Device {
  ip: string;
  name: string;
  port: number;
  connection: "tcp" | "udp";
}

export const {
  reducer: devicesReducer,
  setStore: setDevicesStore,
  sync: syncDevices,
  setQueries: setDeviceQueries,
} = createDynamicReducer<Device>("devices", "ip");