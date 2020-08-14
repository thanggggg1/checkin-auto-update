import constate from "constate";
import {Device} from "../../store/devices";

const useDeviceValue = ({device}: { device: Device }) => {
  return {
    device
  };
}

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);