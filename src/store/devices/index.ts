import { createDynamicReducer } from "../../utils/createDynamicReducer";
import { useSelector } from "react-redux";

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
  multiDelete: deleteDevices,
} = createDynamicReducer<Device>("devices", "ip", {
  byKey: {},
  query: {},
});

const devicesSelector = (state: any) => state.devices.byKey;
export const useDevicesRecord = (): Record<string, Device> => {
  return useSelector(devicesSelector);
};
