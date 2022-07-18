import constate from "constate";
import { deleteDevices, Device, DeviceSyncMethod, useDeviceSyncMethod,syncDevices } from "../../store/devices";
import { useCallback, useEffect, useMemo, useState } from "react";
import useAsyncEffect from "../../utils/useAsyncEffect";
import useAsyncFn from "react-use/lib/useAsyncFn";
import { AttendanceRecord, isRecordExists, syncAttendanceRecords } from "../../store/records";
import Fetch from "../../utils/Fetch";
import { Events, events } from "../../utils/events";
import ZK from "../../packages/js_zklib/ZK";
import useAutoMessageError from "../../hooks/useAutoMessageError";
import moment from "moment";
import _ from "lodash";
import { deleteDeviceById } from "../../store/devices/actions";

export enum ConnectionState {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
}

const LegacyDeviceContext = (() => {
  const [Provider, use] = constate(({ device, syncTurn }: { device: Device, syncTurn: boolean }) => {
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
        timeout: device.timeout || 60000,
        inport: device.inport || 5200,
        port: device.port,
        connectionType: device.connection
      });
    }, [
      device.ip,
      device.timeout,
      device.inport,
      device.port,
      device.connection
    ]);

    /**
     * CONNECT
     */
    const {
      loading: connecting,
      error: connectError,
      call: connect
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
      console.log("disable device ", connection);

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
      syncAttendances
    ] = useAsyncFn(async () => {
      if (connectionState !== ConnectionState.CONNECTED) {
        events.emit(Events.SYNC_DONE);
        return;
      }

      const currentYear = new Date().getFullYear();

      setSyncPercent(0);

      if (!canSendRequest) {
        console.log("canSendRequest events.emit(Events.SYNC_DONE); ", canSendRequest);
        await require("bluebird").delay(400);
        // when sync done thi goi vao day de chuyen sang client tiep theo
        events.emit(Events.SYNC_DONE);
        throw new Error("Socket is not connected");
      }

      setSyncPercent(0.01);

      await disableDevice();

      setSyncPercent(0.02);

      if (syncMethod === DeviceSyncMethod.LEGACY) {
        try {
          await connection.freeData();
          const attendances = await connection.getAttendance(
            (current: number, total: number) => {
              const percent = Math.floor((current / total) * 10000) / 100;
              setSyncPercent(percent);
            }
          );

          setSyncPercent(0);

          await enableDevice();

          const records = attendances
            .map((attendance: any) => {
              const mm = moment(attendance.timestamp);
              if (mm.get("year") < currentYear - 1) {
                return false;
              }
              const id = `${attendance.id}_${mm.valueOf()}`;

              if (isRecordExists(id)) return false;

              return {
                timestamp: mm.valueOf(),
                timeFormatted: mm.format("HH:mm:ss"),
                dateFormatted: mm.format("DD/MM/YYYY"),
                deviceIp: device.ip,
                uid: attendance.id,
                deviceName:device.ip,
                id
              };
            })
            .filter(Boolean) as AttendanceRecord[];
          console.log('time',records[records.length-1].timestamp)

          syncDevices([{ ...device, syncTime: moment().valueOf(),lastSync:records[records.length-1].timestamp }]);

          syncAttendanceRecords(records);
          // when sync done thi goi vao day de chuyen sang client tiep theo
          await require("bluebird").delay(400);
          events.emit(Events.SYNC_DONE);

          return records;
        } catch (e) {
          await enableDevice();
          // when sync done thi goi vao day de chuyen sang client tiep theo
          await require("bluebird").delay(400);
          events.emit(Events.SYNC_DONE);
          return [];
        }
      }

      // Large dataset method
      const attendances = await connection.zklib.getAttendances(
        (current: number, total: number) => {
          const percent = Math.floor((current / total) * 10000) / 100;
          setSyncPercent(percent);
        }
      );

      setSyncPercent(0);

      await enableDevice();
      attendances.data &&
      syncAttendanceRecords(
        // filter exists & map at the same time (filter exists for performance)
        attendances.data.reduce<AttendanceRecord[]>((filtered:AttendanceRecord[], raw:any) => {
          const id = `${raw.deviceUserId}_${raw.recordTime.valueOf()}`;
          const mm = moment(raw.recordTime);

          if (mm.get("year") < currentYear - 1) {
            return filtered;
          }

          if (isRecordExists(id)) return filtered;


          filtered.push({
            uid: Number(raw.deviceUserId),
            timestamp: mm.valueOf(),
            id,
            dateFormatted: mm.format("DD/MM/YYYY"),
            // @ts-ignore
            deviceIp: device.ip,
            // @ts-ignore
            deviceName:device.ip,
            timeFormatted: mm.format("HH:mm:ss")
          });

          return filtered;
        }, [])
      )
      &&       syncDevices([{ ...device, syncTime: moment().valueOf(),lastSync:attendances.data[attendances.data?.length-1].recordTime.valueOf() }]);

      // when sync done thi goi vao day de chuyen sang client tiep theo
      events.emit(Events.SYNC_DONE);
      return attendances;
    }, [
      connection,
      canSendRequest,
      disableDevice,
      enableDevice,
      device.ip,
      syncMethod,
      connectionState
    ]);

    /**
     * REALTIME
     */
    const {
      value: clearRealtime,
      call: startRealtimeAgain
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
            // @ts-ignore
            deviceIp: device.ip,
            // @ts-ignore
            deviceName:device.ip,
            timeFormatted: mm.format("HH:mm:ss")
          };

          Fetch.realtimePush(log);


          syncAttendanceRecords([log]);
        }
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
      if (!isGettingAttendances || syncTurn) {
        syncAttendances();
      }
    }, [syncTurn]);

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

    useEffect(() => {
      if (canSendRequest) {
        setTimeout(() => {
          syncAttendances().then();
        }, 1500);
      }
    }, [canSendRequest]);

    const deleteDevice = useCallback(() => {
      // @ts-ignore
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
      syncPercent
    };
  });

  return {
    Provider,
    use
  };
})();
export default LegacyDeviceContext