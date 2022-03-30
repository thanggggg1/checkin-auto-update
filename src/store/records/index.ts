import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getStore } from "../storeAccess";
import { getPushedRecordIdSet } from "../pushedRecords";
import { getAllCheckinCodes } from "../settings/checkinCodes";

export interface AttendanceRecord {
  id: string;
  uid: number;
  deviceName: string;
  deviceIp: string;
  timestamp: number;
  timeFormatted: string;
  dateFormatted: string;
}

const initialState: Record<string, AttendanceRecord> = {};
const { actions, reducer: recordsReducer } = createSlice({
  name: "records",
  initialState,
  reducers: {
    addRecords(state, action: PayloadAction<AttendanceRecord[]>) {
      const newState = { ...state };
      action.payload.forEach((record) => {
        newState[record.id] = record;
      });

      return newState;
    },
    clearAll() {
      return initialState;
    },
  },
});

export const syncAttendanceRecords = (records: AttendanceRecord[]) => {
  getStore().dispatch(actions.addRecords(records));
};

export const recordsSelector = (state: any) =>
  state.records as Record<string, AttendanceRecord>;

export const recordsArrSelector = createSelector(recordsSelector, (res) =>
  Object.values(res)
);
export const getAllRecordsArr = () => recordsArrSelector(getStore().getState());

export const clearAttendanceRecords = () =>
  getStore().dispatch(actions.clearAll());

export const filterRecords = (
  records: AttendanceRecord[],
  options?: {
    startTime?: number;
    endTime?: number;
    onlyNotPushed?: boolean;
    onlyInEmployeeCheckinCodes?: boolean;
  }
) => {
  const pushedIdSet = options?.onlyNotPushed
    ? getPushedRecordIdSet()
    : new Set<string>();

  const checkinCodes: {[id: string]: number[]} = options?.onlyInEmployeeCheckinCodes
    ? getAllCheckinCodes()
    : {};

  return records.filter((record) => {
    // onlyNotPushed
    if (options?.onlyNotPushed && pushedIdSet.has(record.id)) return false;

    // startTime
    if (options?.startTime && record.timestamp < options.startTime)
      return false;

    // endTime
    if (options?.endTime && record.timestamp > options.endTime) return false;

    // checkinCodes
    if (
      options?.onlyInEmployeeCheckinCodes &&
      checkinCodes[record.deviceIp] &&
      checkinCodes[record.deviceIp].includes(Number(record.uid))
    )
      return true;

    return true;
  });
};

export const isRecordExists = (recordId: string) =>
  !!recordsSelector(getStore().getState())[recordId];

export { recordsReducer };
