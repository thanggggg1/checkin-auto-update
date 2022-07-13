import { createSetting } from "./index";
import { Device } from "../devices";

const {
  get: getSettingZkBioSystem,
  set: setSettingZkBioSystem,
  use: useSettingZkBioSystem,
  clear: clearSettingZkBioSystem
} = createSetting<Boolean>("settingZkBioSystem",false);

export { getSettingZkBioSystem, setSettingZkBioSystem, useSettingZkBioSystem, clearSettingZkBioSystem };