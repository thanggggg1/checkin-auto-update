import constate from "constate";
import { deleteDevices, Device } from "../../store/devices";
import { useCallback, useEffect, useMemo, useState } from "react";
import Pyatt from "../../Services/Pyatt";
import useLatest from "react-use/lib/useLatest";
import useAsyncEffect from "../../utils/useAsyncEffect";
import useAsyncFn from "react-use/lib/useAsyncFn";
import { syncAttendanceRecords } from "../../store/records";
import Fetch from "../../utils/Fetch";
import { Alert } from "antd";
import { Events, events } from "../../utils/events";

export enum PyattRealtimeStatus {
  DISCONNECTED,
  CONNECTING,
  PREPARING,
  CONNECTED,
}

const PyattDeviceContext = (() => {
  const [Provider, use] = constate(({ device }: { device: Device }) => {
    const [realtimeStatus, setRealtimeStatus] = useState(
      PyattRealtimeStatus.DISCONNECTED
    );
    const [syncPercent, setSyncPercent] = useState(0);
    const latestSyncPercent = useLatest(syncPercent);

    const latestRealtimeStatus = useLatest(realtimeStatus);

    const instance = useMemo(() => {
      const output = new Pyatt(device.ip, device.port, device.password);

      if (device.connection === "udp") output.isUdp = true;

      return output;
    }, [device.ip, device.port, device.password, device.connection]);

    // start realtime status automatically
    const {
      call: startRealtime,
      value: closeLiveCapture,
    } = useAsyncEffect(async () => {
      setRealtimeStatus(PyattRealtimeStatus.CONNECTING);

      return instance.liveCapture(
        (error) => {
          Alert({ message: error.message });
          setRealtimeStatus(PyattRealtimeStatus.DISCONNECTED);
        },
        (record) => {
          const log = Pyatt.pyattRecordToAttendance(record, device.ip);
          syncAttendanceRecords([log]);
          Fetch.realtimePush(log);
        },
        (close) => {
          console.log("close?", close);
          setRealtimeStatus(PyattRealtimeStatus.DISCONNECTED);
        },
        (anyData) => {
          if (latestRealtimeStatus.current !== PyattRealtimeStatus.CONNECTED) {
            setRealtimeStatus(PyattRealtimeStatus.PREPARING);
          }

          if (
            anyData.includes("--- Live Capture! (press ctrl+C to break) ---")
          ) {
            setRealtimeStatus(PyattRealtimeStatus.CONNECTED);
          }
        }
      );
    }, [instance]);

    useEffect(() => {
      return closeLiveCapture;
    }, [closeLiveCapture]);

    // auto start realtime if disconnected
    useEffect(() => {
      if (realtimeStatus !== PyattRealtimeStatus.DISCONNECTED) return;

      const timeout = setTimeout(startRealtime, device.timeout || 30000);

      return () => {
        return clearTimeout(timeout);
      };
    }, [realtimeStatus, startRealtime, device.timeout]);

    const [, syncAttendances] = useAsyncFn(async () => {
      try {
        setSyncPercent(0);
        const data = await instance.getRecords({
          onStarted: () => setSyncPercent(0.01),
          onRecords: (records) => {
            syncAttendanceRecords(
              records.map((record) =>
                Pyatt.pyattRecordToAttendance(record, device.ip)
              )
            );
          },
          onPercent: (total, current) => {
            console.log("total", total, current);
            setSyncPercent(Math.floor((current * 100) / total) / 100);
          },
        });

        syncAttendanceRecords(
          data.records.map((record) =>
            Pyatt.pyattRecordToAttendance(record, device.ip)
          )
        );

        setSyncPercent(100);

        await require("bluebird").delay(2000);
        setSyncPercent(0);
      } catch (e) {
        console.log('sync error', e);
        setRealtimeStatus(PyattRealtimeStatus.DISCONNECTED);
      }
    }, [instance]);

    const deleteDevice = useCallback(() => {
      deleteDevices([device.ip]);
    }, [device.ip]);

    useEffect(() => {
      const handler = () => {
        if (!latestSyncPercent.current) syncAttendances();
      };

      events.on(Events.MASS_SYNC, handler);
      return () => {
        events.off(Events.MASS_SYNC, handler);
      };
    }, [syncAttendances]);

    useEffect(() => {
      const ping = require("ping");

      const interval = setInterval(() => {
        ping.promise
          .probe(device.ip, {
            timeout: 3,
          })
          .then(({ alive }: { alive: boolean }) => {
            if (!alive) setRealtimeStatus(PyattRealtimeStatus.DISCONNECTED);
          });
      }, 10000);

      return () => {
        clearInterval(interval);
      };
    }, [device.ip, device.port]);

    return {
      device,
      realtimeStatus,
      syncAttendances,
      syncPercent,
      deleteDevice,
    };
  });

  return {
    Provider,
    use,
  };
})();

export default PyattDeviceContext;
