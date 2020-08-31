import constate from "constate";
import { deleteDevices, Device } from "../../store/devices";
import ZK from "../../packages/js_zklib/ZK";
import { useCallback, useEffect, useState } from "react";
import { useAsyncFn, useLatest, useUpdateEffect } from "react-use";
import { AttendanceRecord, syncAttendanceRecords } from "../../store/records";
import useAutoAlertError from "../../hooks/useAutoAlertError";
import { Events, events } from "../../utils/events";
import { setIntervalAsync } from "set-interval-async/dynamic";
import { clearIntervalAsync } from "set-interval-async";
import moment from "moment";
import Fetch from "../../utils/Fetch";

export enum SyncState {
  NOT_STARTED,
  GETTING_DATA,
  PROCESSING,
}

export enum ConnectionState {
  PENDING,
  CONNECTED,
  CLOSED,
  REFUSED,
  HOSTDOWN,
  TIMEOUT,
  RESET,
  EHOSTUNREACH,
}

const useDeviceValue = ({ device }: { device: Device }) => {
  const [state, setState] = useState(ConnectionState.PENDING);
  const latestState = useLatest(state);
  const [syncState, setSyncState] = useState<SyncState>(SyncState.NOT_STARTED);
  const [realtimeState, setRealtimeState] = useState("Pending");
  const [syncPercent, setSyncPercent] = useState(0);
  const [connection, setConnection] = useState<ZK>(() => {
    return new ZK({
      port: device.port || "4370",
      connectionType: device.connection || "tcp",
      timeout: 5000,
      inport: device.inport || 5200,
      ip: device.ip,
    });
  });

  useUpdateEffect(() => {
    setConnection(
      new ZK({
        port: device.port || "4370",
        connectionType: device.connection || "tcp",
        timeout: 5000,
        inport: device.inport || 5200,
        ip: device.ip,
      })
    );
  }, [device.ip, device.port, device.connection, device.inport]);

  useEffect(() => {
    let interval = 0;

    connection
      .createSocket()
      .then(() => {
        // @todo clear
        // @ts-ignore
        connection.zklib.socket.on("close", () => {
          setState(ConnectionState.CLOSED);
          setRealtimeState("Closed");
        });

        // @ts-ignore
        connection.zklib.socket.on("connection", () => {
          setState(ConnectionState.CONNECTED);
        });

        connection
          .connect()
          .then(async () => {
            setState(ConnectionState.CONNECTED);
          })
          .catch((e) => {
            console.log("first connection error: " + device.ip, e);
          });
      })
      .catch((e) => {
        console.log("create socket error: " + device.ip, e);
      });

    return () => {
      clearInterval(interval);
      connection.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      state !== ConnectionState.CONNECTED ||
      syncState !== SyncState.NOT_STARTED
    )
      return;

    setRealtimeState("Pending");

    let clearFn = null;
    //let interval = setInterval(() => {
    if (state !== ConnectionState.CONNECTED) return;

    if (clearFn) clearFn();
    try {
      clearFn = connection.startMon({
        start: (err) => {
          if (err) return setRealtimeState("Timed out");
          setRealtimeState("Started");
        },
        onatt: (log) => {
          console.log("onatt", log);
          const mm = moment(log.time);

          const record: AttendanceRecord = {
            dateFormatted: mm.format("DD/MM/YYYY"),
            timeFormatted: mm.format("HH:mm"),
            deviceIp: device.ip,
            timestamp: mm.valueOf(),
            uid: log.userId,
            id: `${log.userId}_${mm.valueOf()}`,
          };

          syncAttendanceRecords([record]);

          Fetch.realtimePush(record);
        },
      });
    } catch (e) {
      console.log("eee", e);
    }
    //}, 3000);

    return () => {
      clearInterval(interval);
      clearFn?.();
    };
  }, [state, device.ip, syncState]);

  useEffect(() => {
    const interval = setIntervalAsync(async () => {
      if (latestState.current !== ConnectionState.CONNECTED) {
        try {
          console.log("trying to connect", device.ip);
          await connection.connect();
          setState(ConnectionState.CONNECTED);
        } catch (e) {
          console.log("connect error", e);
          if (e.errno === "ECONNREFUSED") {
            return setState(ConnectionState.REFUSED);
          }
          if (e.errno === "EHOSTDOWN") {
            return setState(ConnectionState.HOSTDOWN);
          }
          if (e.errno === "ETIMEDOUT") {
            return setState(ConnectionState.TIMEOUT);
          }
          if (e.errno === "ECONNRESET") {
            return setState(ConnectionState.RESET);
          }
          if (e.errno === "EHOSTUNREACH") {
            return setState(ConnectionState.EHOSTUNREACH);
          }
          setState(ConnectionState.PENDING);
        }
      }
    }, 3000);
    return () => {
      clearIntervalAsync(interval);
    };
  }, []);

  const [{ error }, syncAttendances] = useAsyncFn(async () => {
    if (state !== ConnectionState.CONNECTED) return;
    try {
      setSyncState(SyncState.GETTING_DATA);

      const attendances = await connection.zklib.getAttendances(
        (current, total) => {
          console.log("progress", device.ip, current, total);
          setSyncPercent(Math.round((current * 100) / total));
        }
      );

      console.log("attendances", attendances);

      setSyncState(SyncState.PROCESSING);
      syncAttendanceRecords(
        // @ts-ignore
        attendances.data.map((attendance) => {
          const mm = moment(attendance.recordTime);
          return {
            id: `${attendance.deviceUserId}_${mm.valueOf()}`,
            uid: attendance.deviceUserId,
            deviceIp: attendance.ip,
            timestamp: attendance.recordTime.valueOf(),
            timeFormatted: mm.format("HH:mm"),
            dateFormatted: mm.format("DD/MM/YYYY"),
          };
        })
      );
      requestAnimationFrame(() => {
        setSyncState(SyncState.NOT_STARTED);
      });
    } catch (e) {
      requestAnimationFrame(() => {
        setSyncState(SyncState.NOT_STARTED);
      });
      throw e;
    }
  }, [connection, state, device]);

  useAutoAlertError(error);

  // Update free space continuously
  // useAsync(async () => {
  //   const interval = setIntervalAsync(async () => {
  //     try {
  //       if (latestState.current !== ConnectionState.CONNECTED) return;
  //       console.log("start getting freesizes", device.ip);
  //       const freeSizes = await connection.getFreeSizes();
  //       console.log("freeSizes", freeSizes);
  //     } catch (e) {
  //       setState(ConnectionState.PENDING);
  //     }
  //   }, 5000);
  //
  //   return () => {
  //     clearIntervalAsync(interval);
  //   };
  // }, [connection]);

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
    syncPercent,
  };
};

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);
