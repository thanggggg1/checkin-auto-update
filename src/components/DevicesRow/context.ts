import constate from "constate";
import { Device } from "../../store/devices";
import ZK from "../../packages/js_zklib/ZK";
import { useEffect, useState } from "react";
import { useAsyncFn } from "react-use";
import {
  formatRawAttendanceRecords,
  syncAttendanceRecords,
} from "../../store/records";
import useAutoAlertError from "../../hooks/useAutoAlertError";
import { Events, events } from "../../utils/events";

export enum SyncState {
  NOT_STARTED,
  GETTING_DATA,
  PROCESSING,
}

const useDeviceValue = ({
  device,
  connection,
}: {
  device: Device;
  connection: ZK;
}) => {
  const [syncState, setSyncState] = useState<SyncState>(SyncState.NOT_STARTED);

  const [{ error }, syncAttendances] = useAsyncFn(async () => {
    try {
      setSyncState(SyncState.GETTING_DATA);
      const attendance = await connection.getAttendance();
      setSyncState(SyncState.PROCESSING);
      syncAttendanceRecords(formatRawAttendanceRecords(attendance, device.ip));
      setSyncState(SyncState.NOT_STARTED);
    } catch (e) {
      setSyncState(SyncState.NOT_STARTED);
      throw e;
    }
  }, [connection, device]);

  useAutoAlertError(error);

  useEffect(() => {
    events.on(Events.MASS_SYNC, syncAttendances);
    return () => {
      events.off(Events.MASS_SYNC, syncAttendances);
    };
  }, [syncAttendances]);

  return {
    device,
    connection,
    syncState,
    syncAttendances,
  };
};

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);
