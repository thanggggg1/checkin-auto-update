import { createSetting } from "./index";
import { Device } from "../devices";

const {
  get: getSettingMode,
  set: setSettingMode,
  use: useSettingMode,
  clear:clearSettingMode
} = createSetting<string>("settingMode", '');

export {getSettingMode,setSettingMode,useSettingMode,clearSettingMode}