import constate from "constate";
import { deleteDevices, Device } from "../../store/devices";
import ZK from "../../packages/js_zklib/ZK";
import { useCallback, useEffect, useState } from "react";
import { useAsyncFn, useUpdateEffect } from "react-use";
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

export enum ConnectionState {
  PENDING,
  CONNECTED,
  CLOSED,
}

const useDeviceValue = ({ device }: { device: Device }) => {
  const [state, setState] = useState(ConnectionState.PENDING);
  const [syncState, setSyncState] = useState<SyncState>(SyncState.NOT_STARTED);
  const [realtimeState, setRealtimeState] = useState("Pending");
  const [connection, setConnection] = useState<ZK>(() => {
    return new ZK({
      port: device.port,
      connectionType: device.connection,
      timeout: 10000,
      inport: 5200,
      ip: device.ip,
    });
  });

  useUpdateEffect(() => {
    setConnection(
      new ZK({
        port: device.port,
        connectionType: device.connection,
        timeout: 5000,
        inport: 5200,
        ip: device.ip,
      })
    );
  }, [device]);

  useEffect(() => {
    let interval = 0;
    connection.connect().then(async () => {
      setState(ConnectionState.CONNECTED);

      // @todo clear
      // @ts-ignore
      connection.zklib.socket.on("close", () => {
        setState(ConnectionState.CLOSED);
        setRealtimeState("Closed");
      });

      setRealtimeState("Pending");
      interval = setInterval(() => {
        connection.startMon({
          start: (err) => {
            if (err) return setRealtimeState("Timed out");
            setRealtimeState("Started");
          },
          onatt: (log) => {
            console.log("onatt", log);
          },
        });
      }, 3000);
    });

    return () => {
      clearInterval(interval);
      connection.disconnect();
    };
  }, [connection]);

  useEffect(() => {
    let interval = 0;
    if (state !== ConnectionState.CONNECTED) {
      interval = setInterval(() => {
        connection.connect();
      }, 3000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [state]);

  const [{ error }, syncAttendances] = useAsyncFn(async () => {
    if (state !== ConnectionState.CONNECTED) return;

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
  }, [connection, state, device]);

  useAutoAlertError(error);

  useEffect(() => {
    events.on(Events.MASS_SYNC, syncAttendances);
    return () => {
      events.off(Events.MASS_SYNC, syncAttendances);
    };
  }, [syncAttendances]);

  const enableDevice = useCallback(() => {
    return connection.enableDevice();
  }, [connection]);

  const disableDevice = useCallback(() => {
    return connection.disableDevice();
  }, [connection]);

  const reconnect = useCallback(() => {
    return connection.connect();
  }, [connection]);

  const deleteDevice = useCallback(() => {
    deleteDevices([device.ip]);
  }, [device.ip]);

  return {
    device,
    connection,
    syncState,
    syncAttendances,
    state,
    realtimeState,
    enableDevice,
    disableDevice,
    reconnect,
    deleteDevice,
  };
};

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);
