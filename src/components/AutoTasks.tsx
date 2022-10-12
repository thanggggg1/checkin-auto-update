import { memo, useEffect } from "react";
import {
  getLastAutoSyncLogsTime,
  setLastAutoSyncLogsTime,
  useAutoSyncLogsMinutes
} from "../store/settings/autoSync";
import {
  getLastAutoPushLogsTime,
  getPreventSyncLogsTimeRanges,
  setLastAutoPushLogsTime,
  useAutoPushLogsMinutes
} from "../store/settings/autoPush";
import { Events, events } from "../utils/events";
import Fetch from "../utils/Fetch";
import { AttendanceRecord, filterRecords, getAllRecordsArr } from "../store/records";
import moment from "moment";
import { useDevicesRecord } from "../store/devices";
import { getStore } from "../store/storeAccess";
import { RawAttendance } from "../packages/js_zklib/ZK";
import log from 'electron-log';
import { timeSleep } from "../utils/sleep";

const minutesToMs = (minutes: number) => minutes * 60 * 1000;

const useAutoFetchCheckinCodes = () => {
  const devices = useDevicesRecord();

  const runFetchAllDevice = async () => {
    const _devices = devices && typeof devices === "object" ?  Object.values(devices) : [];
    for (let i = 0; i < _devices.length; i++) {
      const device = _devices[i];
      if (!device.clientPassword || !device.clientToken) {
        continue
      }
      // @ts-ignore
      await Fetch.requestCheckinCodes(device.ip, {
        token: device.clientToken,
        password: device.clientPassword
      });
    }
  };

  useEffect(() => {
    if (!devices) return;

    runFetchAllDevice().then();

    // Auto request every 12 hours
    const interval = setInterval(
      runFetchAllDevice,
      12 * 60 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);
};

export const AutoTasks = memo(function AutoTasks() {
  const autoSyncLogsMinutes = useAutoSyncLogsMinutes();
  const autoPushLogsMinutes = useAutoPushLogsMinutes();

  useEffect(() => {
    if (!autoPushLogsMinutes) {
      return
    }
    const interval = setInterval(() => {
      const nowMm = moment();
      const now = nowMm.valueOf();
      /**
       * AUTO PUSH
       */
      // const nowMm = moment();
      // const now = nowMm.valueOf();
      //
      // if (autoPushLogsMinutes === 0) return;
      //
      // const lastAutoPushLogsTime = getLastAutoPushLogsTime();
      // if (lastAutoPushLogsTime && (now - minutesToMs(lastAutoPushLogsTime) < lastAutoPushLogsTime)){
      //   // save last auto sync
      //   setLastAutoSyncLogsTime(now);
      //   return;
      // }
      (async () => {
        // start auto push
        // const lastAutoPushLogsTime = getLastAutoPushLogsTime();
        // if (now - minutesToMs(autoPushLogsMinutes) > lastAutoPushLogsTime) {
        //   setLastAutoPushLogsTime(Date.now());
        //   return;
        // }


        try {
          const allLogs: AttendanceRecord[] = Object.values(getStore()?.getState()?.records || {});
          log.info("Auto push data ");
          await timeSleep(30);
          await Fetch.massPushSplitByChunks(
            filterRecords(allLogs, {
              onlyNotPushed: true,
              onlyInEmployeeCheckinCodes: true,
              startTime: moment().startOf("month").valueOf(),
              endTime: moment().valueOf()
            })
          );
        } catch (e) {

        } finally {
          // save last auto push
          setLastAutoPushLogsTime(Date.now());
        }
      })();
    }, minutesToMs(autoPushLogsMinutes));

    return () => {
      interval && clearInterval(interval);
    };
  }, [autoPushLogsMinutes]);

  useEffect(() => {
    if (!autoSyncLogsMinutes) {
      return
    }
    const interval = setInterval(() => {
      /**
       * AUTO SYNC
       */
      const nowMm = moment();
      const now = nowMm.valueOf();

      if (autoSyncLogsMinutes === 0) return;

      // const lastAutoSyncLogsTime = getLastAutoSyncLogsTime();
      // if (lastAutoSyncLogsTime && (now - minutesToMs(autoSyncLogsMinutes) < lastAutoSyncLogsTime)){
      //   // save last auto sync
      //   setLastAutoSyncLogsTime(now);
      //   return;
      // }
      // if on prevent auto sync, cancel
      const shouldCancel = (() => {
        try {
          const logGetPreventSyncLogsTimeRanges = getPreventSyncLogsTimeRanges();
          if (!logGetPreventSyncLogsTimeRanges) {
            return false
          }
          const timeRanges = logGetPreventSyncLogsTimeRanges.split(",").map(t => t.trim());

          for (const range of timeRanges) {
            const [start, end] = range.split("-");
            if (!start || !end) {

              return true;
            }
            if (nowMm.isBetween(moment(start, "HH:mm"), moment(end, "HH:mm"))) {
              console.log("auto sync cancelled");
              return true;
            }
          }

        } catch (e) {
          console.log("Should cancel timerange error", e);
          return true;
        }
      })();

      if (shouldCancel) {
        setLastAutoSyncLogsTime(now);
        return;
      }
      log.info("Auto sync data ");

      // start auto sync
      console.log("fire autoSync");
      events.emit(Events.MASS_SYNC);

      // save last auto sync
      setLastAutoSyncLogsTime(now);
    } , minutesToMs(autoSyncLogsMinutes));

    return () => {
      interval && clearInterval(interval)
    }
  }, [autoSyncLogsMinutes]);

  useAutoFetchCheckinCodes();

  return null;
});

export default AutoTasks;
