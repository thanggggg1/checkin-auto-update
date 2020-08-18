import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {getStore} from "../storeAccess";

export type PushedRecordState = string[];
const initialState: PushedRecordState = [];
const {reducer, actions} = createSlice({
  name: "pushedRecords",
  initialState,
  reducers: {
    addPushedRecords(state, action: PayloadAction<string[]>) {
      const set = new Set(state);
      action.payload.map((recordId) => set.add(recordId));
      return Array.from(set);
    },
  },
});

export const addPushedRecords = (recordIds: string[]) => {
  return getStore().dispatch(actions.addPushedRecords(recordIds));
}

export {
  reducer as pushedRecordsReducer
}