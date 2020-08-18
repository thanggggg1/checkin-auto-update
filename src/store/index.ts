import { createStore, combineReducers } from "@reduxjs/toolkit";
import { devicesReducer, setDevicesStore } from "./devices";
import { setStore } from "./storeAccess";
import { recordsReducer } from "./records";

const rootReducer = combineReducers({
  devices: devicesReducer,
  records: recordsReducer,
});

export const store = createStore(rootReducer);
setDevicesStore(store);

setStore(store);
