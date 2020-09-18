import { memo, useEffect } from "react";
import {
  getLastAutoSyncLogsTime,
  setLastAutoSyncLogsTime,
  useAutoSyncLogsMinutes,
} from "../store/settings/autoSync";
import {
  getLastAutoPushLogsTime,
  getPushLogsFromMinutes,
  setLastAutoPushLogsTime,
  useAutoPushLogsMinutes,
  usePushLogsFromMinutes,
} from "../store/settings/autoPush";
import { Events, events } from "../utils/events";
import Fetch from "../utils/Fetch";
import { filterRecords, getAllRecordsArr } from "../store/records";
import moment from "moment";

const minutesToMs = (minutes: number) => minutes * 60 * 1000;

const useAutoFetchCheckinCodes = () => {
  const { token } = Fetch.useToken();

  useEffect(() => {
    if (!token) return;

    Fetch.requestCheckinCodes();

    // Auto request every 12 hours
    const interval = setInterval(
      Fetch.requestCheckinCodes,
      12 * 60 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [token]);
};

export const AutoTasks = memo(function AutoTasks() {
  const autoSyncLogsMinutes = useAutoSyncLogsMinutes();
  const autoPushLogsMinutes = useAutoPushLogsMinutes();
  const pushLogsFromMinutes = usePushLogsFromMinutes();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      /**
       * AUTO SYNC
       */
      (() => {
        if (autoSyncLogsMinutes === 0) return;

        const lastAutoSyncLogsTime = getLastAutoSyncLogsTime();
        if (now - minutesToMs(autoSyncLogsMinutes) < lastAutoSyncLogsTime)
          return;

        // start auto sync
        console.log("fire autoSync");
        events.emit(Events.MASS_SYNC);

        // save last auto sync
        setLastAutoSyncLogsTime(now);
      })();

      /**
       * AUTO PUSH
       */
      (async () => {
        if (autoPushLogsMinutes === 0) return;

        const lastAutoPushLogsTime = getLastAutoPushLogsTime();
        if (now - minutesToMs(autoPushLogsMinutes) < lastAutoPushLogsTime)
          return;

        // start auto push
        console.log("fire autoPush");

        await Fetch.massPushSplitByChunks(
          filterRecords(getAllRecordsArr(), {
            startTime: moment()
              .subtract(getPushLogsFromMinutes(), "minutes")
              .valueOf(),
            onlyNotPushed: true,
            onlyInEmployeeCheckinCodes: true,
          })
        );

        // save last auto push
        setLastAutoPushLogsTime(Date.now());
      })();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [autoSyncLogsMinutes, autoPushLogsMinutes, pushLogsFromMinutes]);

  useAutoFetchCheckinCodes();

  return null;
});

export default AutoTasks;
