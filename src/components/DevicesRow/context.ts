import constate from "constate";
import { deleteDevices, Device } from "../../store/devices";
import ZK, { ZKFreeSizes } from "../../packages/js_zklib/ZK";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsyncFn } from "react-use";
import { AttendanceRecord, syncAttendanceRecords } from "../../store/records";
import useAutoAlertError from "../../hooks/useAutoAlertError";
import { Events, events } from "../../utils/events";
import moment from "moment";
import Fetch from "../../utils/Fetch";
import useAsyncEffect from "../../utils/useAsyncEffect";
import _ from "lodash";

export enum ConnectionState {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
}

const useDeviceValue = ({ device }: { device: Device }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [syncPercent, _setSyncPercent] = useState(0);
  const setSyncPercent = useMemo(
    () => _.throttle(_setSyncPercent, 500, { leading: true, trailing: true }),
    [_setSyncPercent]
  );
  const [freeSizes, setFreeSizes] = useState<ZKFreeSizes>({
    capacity: 0,
    logs: 0,
    users: 0,
  });

  const connection = useMemo(() => {
    return new ZK({
      ip: device.ip,
      timeout: device.timeout || 3000,
      inport: device.inport || 5200,
      port: device.port,
      connectionType: device.connection,
    });
  }, [device]);

  /**
   * CONNECT
   */
  const {
    loading: connecting,
    error: connectError,
    value: cancelFn,
    call: connect,
  } = useAsyncEffect(async () => {
    await connection.connect();
    setConnectionState(ConnectionState.CONNECTED);
  }, [connection]);

  useAutoAlertError(connectError);

  const canSendRequest =
    !connecting &&
    !connectError &&
    connectionState === ConnectionState.CONNECTED;

  /**
   * DISABLE
   */
  const [
    { loading: isDisabling, error: disableError },
    disableDevice,
  ] = useAsyncFn(async () => {
    if (!canSendRequest) {
      throw new Error("Socket is not connected");
    }

    await connection.disableDevice();
  }, [canSendRequest, connection]);

  useAutoAlertError(disableError);

  /**
   * ENABLE
   */
  const [{ error: enableError }, enableDevice] = useAsyncFn(async () => {
    if (!canSendRequest) {
      throw new Error("Socket is not connected");
    }

    await connection.enableDevice();
  }, [connection, canSendRequest]);

  useAutoAlertError(enableError);

  /**
   * SYNC ATTENDANCES
   */
  const [
    {
      value: attendances,
      loading: isGettingAttendances,
      error: getAttendancesError,
    },
    syncAttendances,
  ] = useAsyncFn(async () => {
    console.log("start syncing", canSendRequest);
    setSyncPercent(0);

    if (!canSendRequest) {
      throw new Error("Socket is not connected");
    }

    setSyncPercent(0.01);

    await disableDevice();

    setSyncPercent(0.02);

    const attendances = await connection.zklib.getAttendances(
      (current: number, total: number) => {
        const percent = Math.floor((current / total) * 10000) / 100;
        console.log("syncing " + device.ip, percent);
        setSyncPercent(percent);
      }
    );

    setSyncPercent(0);

    await enableDevice();

    attendances.data &&
      syncAttendanceRecords(
        attendances.data.map((raw) => {
          const mm = moment(raw.recordTime);
          return {
            uid: Number(raw.deviceUserId),
            timestamp: mm.valueOf(),
            id: `${raw.deviceUserId}_${mm.valueOf()}`,
            dateFormatted: mm.format("DD/MM/YYYY"),
            deviceIp: device.ip,
            timeFormatted: mm.format("HH:mm"),
          };
        })
      );

    return attendances;
  }, [connection, canSendRequest, disableDevice, enableDevice, device.ip]);

  useAutoAlertError(getAttendancesError);

  /**
   * REALTIME
   */
  const {
    value: clearRealtime,
    call: startRealtimeAgain,
  } = useAsyncEffect(async () => {
    if (!canSendRequest) return;

    return connection.startMon({
      start: (err) => {
        console.log("start mon err", err);
      },
      onatt: (ret) => {
        const mm = moment(ret.time);
        const log: AttendanceRecord = {
          uid: Number(ret.userId),
          timestamp: mm.valueOf(),
          id: `${ret.userId}_${mm.valueOf()}`,
          dateFormatted: mm.format("DD/MM/YYYY"),
          deviceIp: device.ip,
          timeFormatted: mm.format("HH:mm"),
        };

        console.log("realtime log", log);

        Fetch.realtimePush(log);

        syncAttendanceRecords([log]);
      },
    });
  }, [connection, canSendRequest, device.ip]);

  useEffect(() => {
    return () => {
      clearRealtime?.();
    };
  }, [clearRealtime]);

  /**
   * FREE SIZES
   */
  useEffect(() => {
    const handler = async () => {
      // @ts-ignore
      if (!connection.zklib?.socket?.writable) {
        setConnectionState(ConnectionState.DISCONNECTED);
        return;
      }

      if (isGettingAttendances) return;

      try {
        const freeSizes = await connection.getFreeSizes();
        setFreeSizes(freeSizes);
      } catch (e) {
        console.log("get free sizes error", e);
        setConnectionState(ConnectionState.DISCONNECTED);
      }
    };

    const interval = setInterval(handler, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isGettingAttendances, connection]);

  useEffect(() => {
    const handler = () => {
      if (isGettingAttendances) return;
      syncAttendances();
    };

    events.on(Events.MASS_SYNC, handler);
    return () => {
      events.off(Events.MASS_SYNC, handler);
    };
  }, [syncAttendances, isGettingAttendances]);

  /**
   * AUTO RECONNECT
   */
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("start reconnect", connecting, connectionState);
      if (connecting) return;
      if (
        connectionState === ConnectionState.CONNECTED ||
        connectionState === ConnectionState.CONNECTING
      )
        return;

      connect().then(startRealtimeAgain);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [connectionState, connecting, connect]);

  const deleteDevice = useCallback(() => {
    deleteDevices([device.ip]);
  }, [device.ip]);

  return {
    device,
    connection,
    syncAttendances,
    connectionState,
    enableDevice,
    disableDevice,
    reconnect: connect,
    deleteDevice,
    syncPercent,
    freeSizes,
  };
};

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);
