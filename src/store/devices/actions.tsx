import { getStore } from "../storeAccess";
import { Device } from "./index";

export const getDeviceById = (id: string) => {
  const _state = getStore().getState();
  console.log('_state ', _state);
  return ((_state || {})['devices'] || {}).byKey[id] as Device
};