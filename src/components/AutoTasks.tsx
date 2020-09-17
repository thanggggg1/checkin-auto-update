import { memo, useEffect } from "react";
import {
  getLastAutoSyncLogsTime,
  setLastAutoSyncLogsTime,
  useAutoSyncLogsMinutes,
} from "../store/settings/autoSync";
import {
  getLastAutoPushLogsTime,
  setLastAutoPushLogsTime,
  useAutoPushLogsMinutes,
  usePushLogsFromMinutes,
} from "../store/settings/autoPush";
import { Events, events } from "../utils/events";

const minutesToMs = (minutes: number) => minutes * 60 * 1000;

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
      (() => {
        if (autoPushLogsMinutes === 0) return;

        const lastAutoPushLogsTime = getLastAutoPushLogsTime();
        if (now - minutesToMs(autoPushLogsMinutes) < lastAutoPushLogsTime)
          return;

        // start auto push
        console.log("fire autoPush");

        // @todo

        // save last auto push
        setLastAutoPushLogsTime(Date.now());
      })();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [autoPushLogsMinutes, autoPushLogsMinutes, pushLogsFromMinutes]);

  return null;
});

export default AutoTasks;
