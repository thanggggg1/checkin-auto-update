import { createSetting } from "./index";
import { createSelector } from "@reduxjs/toolkit";
import { getStore } from "../storeAccess";

const {
  use: useCheckinCodes,
  set: setCheckinCodes,
  get: getCheckinCodes,
} = createSetting<number[]>("checkinCodes", []);

const checkinCodesSelector = (state: any) => {
  return state.settings.checkinCodes as number[];
};

const checkinCodesSetSelector = createSelector(
  checkinCodesSelector,
  (res) => new Set(res)
);

const getCheckinCodesSet = () => checkinCodesSetSelector(getStore().getState());

const getCheckinCodesSetByIp = (ip: string) => {
  const settings = getStore().getState()?.settings || {};
  return new Set(settings[ip] || [])
};
const getAllCheckinCodes = () => {
  return getStore().getState()?.settings || {} as {[ip: string]: number[]}
}; // return object {[ip: string]: string[]}

export {
  useCheckinCodes,
  getCheckinCodes,
  setCheckinCodes,
  getCheckinCodesSet,
  getCheckinCodesSetByIp,
  getAllCheckinCodes
};
