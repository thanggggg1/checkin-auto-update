import { createSetting } from "./index";
import { Device } from "../devices";

const {
  get: getSettingBioStar,
  set: setSettingBioStar,
  use: useSettingBioStar,
  clear: clearSettingBioStar
} = createSetting<Device>("settingBioStar",{
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

export { getSettingBioStar, setSettingBioStar, useSettingBioStar, clearSettingBioStar };