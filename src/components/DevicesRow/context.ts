import constate from "constate";
import {Device} from "../../store/devices";
import ZK from "../../packages/js_zklib/ZK";

const useDeviceValue = ({device, connection}: { device: Device, connection: ZK }) => {
  return {
    device,
    connection
  };
}

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);