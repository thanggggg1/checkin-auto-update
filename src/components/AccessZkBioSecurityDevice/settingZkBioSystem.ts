import { createSetting } from "../../store/settings";
import { Device } from "../../store/devices";

const {
  get: getSettingZkBioSystem,
  set: setSettingZkBioSystem,
  use: useSettingZkBioSystem,
  clear: clearSettingZkBioSystem
} = createSetting<Device>("settingZkBioSystem",{
  clientPassword: "", //"123456",
  clientToken: "", //"NzktMTEtZDg1MWZmNGE2ZTM1M2UxMA",
  domain: "", // "https://10.20.1.201:8098",
  name: "", //
  password: "", //"Vcc123**",
  username: "", //"admin",
  status: "Online",
  token: "",
  syncMethod: "",
  connection: "tcp",
  ip:''
});

export { getSettingZkBioSystem, setSettingZkBioSystem, useSettingZkBioSystem, clearSettingZkBioSystem };