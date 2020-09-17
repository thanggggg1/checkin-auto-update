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
  get: getPushLogsFromMinutes,
  set: setPushLogsFromMinutes,
  use: usePushLogsFromMinutes,
} = createSetting<number>("pushLogsFromMinutes", 30);

export {
  getAutoPushLogsMinutes,
  setAutoPushLogsMinutes,
  useAutoPushLogsMinutes,
  getLastAutoPushLogsTime,
  setLastAutoPushLogsTime,
  useLastAutoPushLogsTime,
  getPushLogsFromMinutes,
  setPushLogsFromMinutes,
  usePushLogsFromMinutes,
};
