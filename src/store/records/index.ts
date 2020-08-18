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
  },
});

export const formatRawAttendanceRecord = (
  rawAttendanceRecord: RawAttendanceRecord,
  deviceIp: string
): AttendanceRecord => {
  const mm = moment(rawAttendanceRecord.timestamp);
  return {
    id: `${rawAttendanceRecord.id}_${rawAttendanceRecord.timestamp.valueOf()}`,
    uid: rawAttendanceRecord.id,
    deviceIp,
    timestamp: rawAttendanceRecord.timestamp.valueOf(),
    timeFormatted: mm.format("HH:mm"),
    dateFormatted: mm.format("DD/MM/YYYY"),
  };
};

export const formatRawAttendanceRecords = (
  rawAttendanceRecords: RawAttendanceRecord[],
  deviceIp: string
) =>
  rawAttendanceRecords.map((record) =>
    formatRawAttendanceRecord(record, deviceIp)
  );

export const syncAttendanceRecords = (records: AttendanceRecord[]) => {
  getStore().dispatch(actions.addRecords(records));
};

export { recordsReducer };
