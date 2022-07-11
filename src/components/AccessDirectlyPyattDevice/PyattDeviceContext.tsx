import constate from "constate";
import { deleteDevices, Device } from "../../store/devices";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Pyatt from "../../Services/Pyatt";
import useLatest from "react-use/lib/useLatest";
import useAsyncEffect from "../../utils/useAsyncEffect";
import useAsyncFn from "react-use/lib/useAsyncFn";
import { syncAttendanceRecords } from "../../store/records";
import Fetch from "../../utils/Fetch";
import { Modal } from "antd";
import useAutoAlertError from "../../hooks/useAutoAlertError";
import convertPyzkErrorToMessage from "../../utils/convertPyzkErrorToMessage";
import { Events, events } from "../../utils/events";

export enum PyattRealtimeStatus {
  DISCONNECTED,
  CONNECTING,
  PREPARING,
  CONNECTED,
}

const PyattDeviceContext = (() => {
  const [Provider, use] = constate(({ device, syncTurn }: { device: Device, syncTurn: boolean }) => {
    const [realtimeStatus, setRealtimeStatus] = useState(
      PyattRealtimeStatus.DISCONNECTED
    );
    const [syncPercent, setSyncPercent] = useState("");
    const latestSyncPercent = useLatest(syncPercent);
    const latestRealtimeStatus = useLatest(realtimeStatus);

    const isGettingRecordRef = useRef(false);

    const instance = useMemo(() => {
      const output = new Pyatt(device.ip, device.port, device.password);

      if (device.connection === "udp") output.isUdp = true;

      return output;
    }, [device.ip, device.port, device.password, device.connection]);

    // start realtime status automatically
    const {
      error: startRealtimeError,
      call: startRealtime,
      value: closeLiveCapture,
    } = useAsyncEffect(async () => {
      if (isGettingRecordRef.current) return;

      setRealtimeStatus(PyattRealtimeStatus.CONNECTING);

      return instance.liveCapture(
        (error) => {
          if (isGettingRecordRef.current) return;

          Modal.error({ content: error.message });
          setRealtimeStatus(PyattRealtimeStatus.DISCONNECTED);
        },
        (record) => {
          const log = Pyatt.pyattRecordToAttendance(record, device.ip);

          if (log.uid == 0) return;

          syncAttendanceRecords([log]);
          Fetch.realtimePush(log);
        },
        () => {
          setRealtimeStatus(PyattRealtimeStatus.DISCONNECTED);
        },
        (anyData) => {
          console.log("anyData", device.ip, anyData);

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

    useAutoAlertError(convertPyzkErrorToMessage(startRealtimeError));

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
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(true)
        }, 1000)
      });
      if (realtimeStatus !== PyattRealtimeStatus.CONNECTED) {
        events.emit(Events.SYNC_DONE);
        return
      }
      try {
        setSyncPercent("Starting");
        isGettingRecordRef.current = true;
        const data = await instance.getRecords({
          onStarted: () => setSyncPercent("Preparing"),
          onRecords: (records) => {
            syncAttendanceRecords(
              records
                .map((record) =>
                  Pyatt.pyattRecordToAttendance(record, device.ip)
                )
                .filter((r) => r.uid != 0)
            );
          },
          onPercent: (total, current) => {
            console.log("total", total, current);
            setSyncPercent(`${current}/${total}`);
          },
        });

        console.log("got it all");

        isGettingRecordRef.current = false;

        syncAttendanceRecords(
          data.records
            .map((record) => Pyatt.pyattRecordToAttendance(record, device.ip))
            .filter((r) => r.uid != 0)
        );

        setSyncPercent("Done");
        if (latestRealtimeStatus.current === PyattRealtimeStatus.DISCONNECTED)
          startRealtime();

        await require("bluebird").delay(2000);
        setSyncPercent("");

        // when sync done thi goi vao day de chuyen sang client tiep theo
        events.emit(Events.SYNC_DONE);
      } catch (e) {
        console.log("sync error", e);

        if (latestRealtimeStatus.current === PyattRealtimeStatus.DISCONNECTED)
          startRealtime();
        Modal.error({ content: convertPyzkErrorToMessage(e) });
        isGettingRecordRef.current = false;
        setRealtimeStatus(PyattRealtimeStatus.DISCONNECTED);

        // when sync done thi goi vao day de chuyen sang client tiep theo
        events.emit(Events.SYNC_DONE);
      }
    }, [instance, realtimeStatus, startRealtime]);

    const deleteDevice = useCallback(() => {
      deleteDevices([device.ip]);
    }, [device.ip]);

    useEffect(() => {
      if (syncTurn && !latestSyncPercent.current) {
        syncAttendances();
        return
      }
    }, [syncTurn]);

    useEffect(() => {
      if (realtimeStatus === PyattRealtimeStatus.CONNECTED) {
        setTimeout(() => {
          if (isGettingRecordRef.current) {
            return
          }
          syncAttendances().then();
        }, 1500)
      }
    }, [realtimeStatus])

    useEffect(() => {
      const ping = require("ping");

      const interval = setInterval(() => {
        ping.promise
          .probe(device.ip, {
            timeout: 3,
          })
          .then(({ alive }: { alive: boolean }) => {
            if (!alive) setRealtimeStatus(PyattRealtimeStatus.DISCONNECTED);
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
      startRealtime,
    };
  });

  return {
    Provider,
    use,
  };
})();

export default PyattDeviceContext;
