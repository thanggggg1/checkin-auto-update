import { createSetting } from "./index";

const {
  get: getAutoPushLogsMinutes,
  set: setAutoPushLogsMinutes,
  use: useAutoPushLogsMinutes,
} = createSetting<number>("autoPushLogsMinutes", 0);

const {
  get: getLastAutoPushLogsTime,
  set: setLastAutoPushLogsTime,
  use: useLastAutoPushLogsTime
} = createSetting<number>("lastAutoPushLogsTime", 0);

export {
  getAutoPushLogsMinutes,
  setAutoPushLogsMinutes,
  useAutoPushLogsMinutes,

  getLastAutoPushLogsTime,
  setLastAutoPushLogsTime,
  useLastAutoPushLogsTime
}
