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

const {
  get: getSyncing,
  set: setSyncing,
  use: useSyncing
} = createSetting<string>("syncingEvent", '0');
// 0 Dang ko lam gi ca
// 1 Dang dong bo
// 2 pause


export {
  getSyncing,
  setSyncing,
  useSyncing,
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
