import { createStore, combineReducers } from "@reduxjs/toolkit";
import { devicesReducer, setDevicesStore } from "./devices";
import { setStore } from "./storeAccess";
import { recordsReducer } from "./records";
import { pushedRecordsReducer } from "./pushedRecords";
import { settingsReducer } from "./settings";

const rootReducer = combineReducers({
  devices: devicesReducer,
  records: recordsReducer,
  pushedRecords: pushedRecordsReducer,
  settings: settingsReducer,
});

export const store = createStore(rootReducer);
setDevicesStore(store);
setStore(store);
