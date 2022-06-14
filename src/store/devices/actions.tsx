import { getStore } from "../storeAccess";
import { Device } from "./index";

export const getDeviceById = (id: string) => {
  const _state = getStore().getState();
  return ((_state || {})['devices'] || {}).byKey[id] as Device
};