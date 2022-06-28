import { createSetting } from "./index";
import { Device } from "../devices";

const {
  get: getSettingSystem,
  set: setSettingSystem,
  use: useSettingSystem,
  clear:clearSettingSystem
} = createSetting<Device>("settingSystem", {
  clientPassword: "", //"123456",
  clientToken: "", //"NzktMTctODQxZmJmYjNjMGM3YjJmMw",
  domain: "", // "https://14.241.105.154/",
  name: "", //
  password: "", //"Base@53rv1c3",
  username: "", //"admin",
  status:'Online',
  token:''
});

export {getSettingSystem,setSettingSystem,useSettingSystem,clearSettingSystem}