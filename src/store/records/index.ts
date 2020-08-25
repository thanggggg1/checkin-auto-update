import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import moment from "moment";
import { getStore } from "../storeAccess";

export interface AttendanceRecord {
  id: string;
  uid: number;
  deviceIp: string;
  timestamp: number;
  timeFormatted: string;
  dateFormatted: string;
}

export type RawAttendanceRecord = {
  [x in string | number]: any;
} & {
  id: number;
  uid: number;
  timestamp: Date;
};

const initialState: Record<string, AttendanceRecord> = {};
const { actions, reducer: recordsReducer } = createSlice({
  name: "records",
  initialState,
  reducers: {
    addRecords(state, action: PayloadAction<AttendanceRecord[]>) {
      action.payload.forEach((attendanceRecord) => {
        state[attendanceRecord.id] = attendanceRecord;
      });
    },
    clearAll() {
      return initialState;
    },
  },
});

export const syncAttendanceRecords = (records: AttendanceRecord[]) => {
  getStore().dispatch(actions.addRecords(records));
};

export const clearAttendanceRecords = () =>
  getStore().dispatch(actions.clearAll());

export { recordsReducer };
