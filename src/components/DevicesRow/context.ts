import constate from "constate";
import { deleteDevices, Device } from "../../store/devices";
import ZK from "../../packages/js_zklib/ZK";
import { useCallback, useEffect, useState } from "react";
import { useAsyncFn, useLatest, useUpdateEffect } from "react-use";
import { AttendanceRecord, syncAttendanceRecords } from "../../store/records";
import useAutoAlertError from "../../hooks/useAutoAlertError";
import { Events, events } from "../../utils/events";
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
        port: device.port || 4370,
        connectionType: device.connection || "tcp",
        timeout: 5000,
        inport: device.inport || 5200,
        ip: device.ip,
      })
    );
  }, [device.ip, device.port, device.connection, device.inport]);

  useEffect(() => {
        connection
          .connect()
          .then(async () => {
            setState(ConnectionState.CONNECTED);

            connection.startMon({
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
          })
          .catch((e) => {
            console.log("first connection error: " + device.ip, e);
          });

    return () => {
      connection.disconnect();
    };
  }, []);

  const [{ error }, syncAttendances] = useAsyncFn(async () => {
    if (state !== ConnectionState.CONNECTED) return;
    try {
      setSyncState(SyncState.GETTING_DATA);

      await connection.disableDevice();

      // @ts-ignore
      const attendances = await connection.zklib.getAttendances(
        (current: number, total: number) => {
          setSyncPercent(Math.round((current * 100) / total));
        }
      );

      await connection.enableDevice();

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

      connection.enableDevice();
    } catch (e) {
      connection.enableDevice();
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
