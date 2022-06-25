import { createStore, combineReducers } from "@reduxjs/toolkit";
import { devicesReducer, setDevicesStore } from "./devices";
import { setStore } from "./storeAccess";
import { recordsReducer } from "./records";
import { pushedRecordsReducer } from "./pushedRecords";
import { settingsReducer } from "./settings";
import { persistStore, persistReducer } from "redux-persist";
import createElectronStorage from "redux-persist-electron-storage";

const rootReducer = combineReducers({
  devices: devicesReducer,
  records: recordsReducer,
  pushedRecords: pushedRecordsReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer(
  {
    key: "root",
    storage: createElectronStorage(),
    blacklist: ["syncingEvent"],
    throttle: 500
  },
  rootReducer
);

export const store = createStore(persistedReducer);
export const persistor = persistStore(store);

setDevicesStore(store);
setStore(store);
