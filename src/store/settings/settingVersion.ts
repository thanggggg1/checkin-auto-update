import { createSetting } from "./index";
import { Device } from "../devices";

const {
  get: getSettingVersion,
  set: setSettingVersion,
  use: useSettingVersion,
  clear:clearSettingVersion
} = createSetting<string>("settingVersion", '');

export {getSettingVersion,setSettingVersion,useSettingVersion,clearSettingVersion}