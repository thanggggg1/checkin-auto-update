import { createSetting } from "./index";

const {
  get: getAutoPushLogsMinutes,
  set: setAutoPushLogsMinutes,
  use: useAutoPushLogsMinutes,
} = createSetting<number>("autoPushLogsMinutes", 0);

const {
  get: getLastAutoPushLogsTime,
  set: setLastAutoPushLogsTime,
  use: useLastAutoPushLogsTime,
} = createSetting<number>("lastAutoPushLogsTime", 0);

const {
  get: getPreventSyncLogsTimeRanges,
  set: setPreventSyncLogsTimeRanges,
  use: usePreventSyncLogsTimeRanges
} = createSetting<string>("preventSyncLogsTimeRanges", '');

export {
  getAutoPushLogsMinutes,
  setAutoPushLogsMinutes,
  useAutoPushLogsMinutes,
  getLastAutoPushLogsTime,
  setLastAutoPushLogsTime,
  useLastAutoPushLogsTime,
  getPreventSyncLogsTimeRanges,
  setPreventSyncLogsTimeRanges,
  usePreventSyncLogsTimeRanges
};
