import { createSetting } from "./index";

const {use: usePushingPercent, set: setPushingPercent, get: getPushingPercent} = createSetting<number>('pushingPercent', 0);

export {
  usePushingPercent,
  getPushingPercent,
  setPushingPercent
}
