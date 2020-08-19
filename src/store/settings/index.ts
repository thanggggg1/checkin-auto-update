import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getStore } from "../storeAccess";

const initialState: Record<string, any> = {};

const { actions, reducer } = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSetting(state, action: PayloadAction<{ key: string; value: any }>) {
      state[action.payload.key] = action.payload.value;
    },
  },
});

const setSetting = (key: string, value: any) => {
  return getStore().dispatch(actions.setSetting({ key, value }));
};

export const createSetting = <T>(key: string, defaultValue: T) => {
  const set = (value: T) => setSetting(key, value);
  const get = (): T => getStore().getState().settings[key] || defaultValue;

  return {
    get,
    set,
  };
};

export {
  reducer as settingsReducer
}