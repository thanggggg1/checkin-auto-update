import { createStore, combineReducers } from "@reduxjs/toolkit";
import { devicesReducer, setDevicesStore } from "./devices";

const rootReducer = combineReducers({
  devices: devicesReducer,
});

export const store = createStore(rootReducer);
setDevicesStore(store);
