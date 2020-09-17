import { createSetting } from "./index";
import { createSelector } from "@reduxjs/toolkit";
import { getStore } from "../storeAccess";

const {
  use: useCheckinCodes,
  set: setCheckinCodes,
  get: getCheckinCodes,
} = createSetting<number[]>("checkinCodes", []);

const checkinCodesSelector = (state: any) =>
  state.settings.checkinCodes as number[];
const checkinCodesSetSelector = createSelector(
  checkinCodesSelector,
  (res) => new Set(res)
);

const getCheckinCodesSet = () => checkinCodesSetSelector(getStore().getState());

export {
  useCheckinCodes,
  getCheckinCodes,
  setCheckinCodes,
  getCheckinCodesSet,
};
