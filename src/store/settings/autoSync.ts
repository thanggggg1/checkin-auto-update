import { createSetting } from "./index";

const {
  get: getAutoSyncLogsMinutes,
  set: setAutoSyncLogsMinutes,
  use: useAutoSyncLogsMinutes,
} = createSetting<number>("autoSyncLogsMinutes", 0);

const {
  get: getLastAutoSyncLogsTime,
  set: setLastAutoSyncLogsTime,
  use: useLastAutoSyncLogsTime
} = createSetting<number>("lastAutoSyncLogsTime", 0);

export {
  getAutoSyncLogsMinutes,
  setAutoSyncLogsMinutes,
  useAutoSyncLogsMinutes,

  getLastAutoSyncLogsTime,
  setLastAutoSyncLogsTime,
  useLastAutoSyncLogsTime
}
