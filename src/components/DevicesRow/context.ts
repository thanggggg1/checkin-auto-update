import constate from "constate";
import {
  deleteDevices,
  Device,
  DeviceSyncMethod,
  useDeviceSyncMethod,
} from "../../store/devices";
import ZK from "../../packages/js_zklib/ZK";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsyncFn } from "react-use";
import {
  AttendanceRecord,
  isRecordExists,
  syncAttendanceRecords,
} from "../../store/records";
import { Events, events } from "../../utils/events";
import moment from "moment";
import Fetch from "../../utils/Fetch";
import useAsyncEffect from "../../utils/useAsyncEffect";
import _ from "lodash";
import useAutoMessageError from "../../hooks/useAutoMessageError";

export enum ConnectionState {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
}

const useDeviceValue = ({ device }: { device: Device }) => {
  const syncMethod = useDeviceSyncMethod(device);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [syncPercent, _setSyncPercent] = useState(0);
  const setSyncPercent = useMemo(
    () => _.throttle(_setSyncPercent, 500, { leading: true, trailing: true }),
    [_setSyncPercent]
  );

  const connection = useMemo(() => {
    return new ZK({
      ip: device.ip,
      timeout: device.timeout || 3000,
      inport: device.inport || 5200,
      port: device.port,
      connectionType: device.connection,
    });
  }, [
    device.ip,
    device.timeout,
    device.inport,
    device.port,
    device.connection,
  ]);

  /**
   * CONNECT
   */
  const {
    loading: connecting,
    error: connectError,
    call: connect,
  } = useAsyncEffect(async () => {
    setConnectionState(ConnectionState.CONNECTING);
    try {
      await connection.connect();
      setConnectionState(ConnectionState.CONNECTED);
    } catch (e) {
      setConnectionState(ConnectionState.DISCONNECTED);
      throw e;
    }
  }, [connection]);

  useAutoMessageError(connectError);

  const canSendRequest =
    !connecting &&
    !connectError &&
    connectionState === ConnectionState.CONNECTED;

  /**
   * DISABLE
   */
  const [{ error: disableError }, disableDevice] = useAsyncFn(async () => {
    if (!canSendRequest) {
      throw new Error("Socket is not connected");
    }

    await connection.disableDevice();
  }, [canSendRequest, connection]);

  useAutoMessageError(disableError);

  /**
   * ENABLE
   */
  const [{ error: enableError }, enableDevice] = useAsyncFn(async () => {
    if (!canSendRequest) {
      throw new Error("Socket is not connected");
    }

    await connection.enableDevice();
  }, [connection, canSendRequest]);

  useAutoMessageError(enableError);

  /**
   * SYNC ATTENDANCES
   */
  const [
    { loading: isGettingAttendances },
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

    if (syncMethod === DeviceSyncMethod.LEGACY) {
      await connection.freeData();
      const attendances = await connection.getAttendance(
        (current: number, total: number) => {
          const percent = Math.floor((current / total) * 10000) / 100;
          console.log("syncing " + device.ip, percent);
          setSyncPercent(percent);
        }
      );

      setSyncPercent(0);

      await enableDevice();

      const records = attendances
        .map((attendance) => {
          const mm = moment(attendance.timestamp);

          const id = `${attendance.id}_${mm.valueOf()}`;

          if (isRecordExists(id)) return false;

          return {
            timestamp: mm.valueOf(),
            timeFormatted: mm.format("HH:mm:ss"),
            dateFormatted: mm.format("DD/MM/YYYY"),
            deviceIp: device.ip,
            uid: attendance.id,
            id,
          };
        })
        .filter(Boolean) as AttendanceRecord[];

      syncAttendanceRecords(records);

      return records;
    }

    // Large dataset method
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
        // filter exists & map at the same time (filter exists for performance)
        attendances.data.reduce<AttendanceRecord[]>((filtered, raw) => {
          const id = `${raw.deviceUserId}_${raw.recordTime.valueOf()}`;

          if (isRecordExists(id)) return filtered;

          const mm = moment(raw.recordTime);
          filtered.push({
            uid: Number(raw.deviceUserId),
            timestamp: mm.valueOf(),
            id,
            dateFormatted: mm.format("DD/MM/YYYY"),
            deviceIp: device.ip,
            timeFormatted: mm.format("HH:mm"),
          });

          return filtered;
        }, [])
      );

    return attendances;
  }, [
    connection,
    canSendRequest,
    disableDevice,
    enableDevice,
    device.ip,
    syncMethod,
  ]);

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
          timeFormatted: mm.format("HH:mm:ss"),
        };

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
   * This is a heartbeat to check is connection still good.
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
        const serial = await connection.serialNumber();

        console.log("serial", serial);
      } catch (e) {
        console.log("get serial error", e);
        setConnectionState(ConnectionState.DISCONNECTED);
      }
    };

    const interval = setInterval(handler, (device.heartbeat || 1) * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isGettingAttendances, connection, device.heartbeat]);

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
      if (
        connectionState === ConnectionState.CONNECTED ||
        connectionState === ConnectionState.CONNECTING
      )
        return;

      connect().then(startRealtimeAgain);
    }, (device.autoReconnect || 30) * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [connectionState, connect, device.autoReconnect]);

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
  };
};

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);
