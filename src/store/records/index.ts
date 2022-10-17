import create from "zustand";
import { persist } from 'zustand/middleware';
import fs from 'fs';
import log from 'electron-log';
import { getDatesBetween } from "../../utils";

export interface AttendanceRecord {
  id: string;
  uid: number;
  deviceName: string;
  deviceIp: string;
  timestamp: number;
  timeFormatted: string;
  dateFormatted: string;
}

// const initialState: Record<string, AttendanceRecord> = {};
// const { actions, reducer: recordsReducer } = createSlice({
//   name: "records",
//   initialState,
//   reducers: {
//     addRecords(state, action: PayloadAction<AttendanceRecord[]>) {
//       const newState = { ...state };
//       action.payload.forEach((record) => {
//         newState[record.id] = record;
//       });
//
//       return newState;
//     },
//     clearAll() {
//       return initialState;
//     },
//   },
// });
//
// export const syncAttendanceRecords = (records: AttendanceRecord[]) => {
//   getStore().dispatch(actions.addRecords(records));
// };
//
// export const recordsSelector = (state: any) =>
//   state.records as Record<string, AttendanceRecord>;
//
// export const recordsArrSelector = createSelector(recordsSelector, (res) =>
//   Object.values(res || {})
// );
// export const getAllRecordsArr = () => recordsArrSelector(getStore().getState());
//
// export const clearAttendanceRecords = () =>
//   getStore().dispatch(actions.clearAll());
//
// export const  filterRecords = (
//   records: AttendanceRecord[],
//   options?: {
//     startTime?: number;
//     endTime?: number;
//     onlyNotPushed?: boolean;
//     onlyInEmployeeCheckinCodes?: boolean;
//   }
// ) => {
//   // const pushedIdSet = options?.onlyNotPushed
//   //   ? getPushedRecordIdSet()
//   //   : new Set<string>();
//
//   const checkinCodes: {[id: string]: number[]} = options?.onlyInEmployeeCheckinCodes
//     ? getAllCheckinCodes()
//     : {};
//
//   return records.filter((record) => {
//     // onlyNotPushed
//     // if (options?.onlyNotPushed && pushedIdSet.has(record.id)) return false;
//
//     // startTime
//     if (options?.startTime && record.timestamp < options.startTime)
//       return false;
//
//     // endTime
//     if (options?.endTime && record.timestamp > options.endTime) return false;
//
//     // checkinCodes
//     if (
//       options?.onlyInEmployeeCheckinCodes &&
//       checkinCodes[record.deviceIp] &&
//       checkinCodes[record.deviceIp].includes(Number(record.uid))
//     )
//       return true;
//
//     return true;
//   });
// };
//
// export const isRecordExists = (recordId: string) =>
//   !!recordsSelector(getStore().getState())[recordId];
//
// export { recordsReducer };

const recordStore = create(persist(() => ({
  records: {}
}), {
  name: 'records'
}));


const getLogsByDay:any = async (day: string) => { // DD-MM-YYYY
  const filePath = 'C://checkin-data/' +day + '.txt';
  if (!fs.existsSync(filePath)) {
    return {}
  } else {
    const data = await new Promise(resolve => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        try {
          if (err) {
            log.error("[READ FILE] error " + filePath + ' >>>>> ' + err?.message);
            console.log("[READ FILE] error " + filePath + ' >>>>> ' + err?.message);
            resolve({});
            return
          }
          if (data) {
            resolve(JSON.parse(data));
            return
          }
        } catch (e) {
          log.error("[READ FILE CATCH] error " + filePath + ' >>>>> ' + err?.message);
          console.log("[READ FILE CATCH] error " + filePath + ' >>>>> ' + err?.message);
          resolve({})
        }
      })
    });
    return data
  }
};


const saveLogsByDay = async (day: string, data: Record<string, AttendanceRecord>) => {
    const filePath = 'C://checkin-data/' + day + '.txt';
    if (!fs.existsSync(filePath)) {
      fs.writeFile(filePath, JSON.stringify(data), err => {
        if (err) {
          console.log('[SAVE FILE FAIL] ' + filePath + err.message);
          log.error('[SAVE FILE FAIL] ' + filePath + err.message);
        }
      });
      return
    }
  const oldData = getLogsByDay(day);
  const newData = {
    ...data,
    ...oldData
  };
  fs.writeFile(filePath, JSON.stringify(newData), err => {
    if (err) {
      console.log('[SAVE FILE FAIL 2] ' + filePath + err.message);
      log.error('[SAVE FILE FAIL 2] ' + filePath + err.message);
    }
  });
};

export const syncAttendanceRecords = async (records: AttendanceRecord[]) => {
  let result: any = {};
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const day = record.dateFormatted.replace(/\//g, '-');

    if (result[day]) {
      result[day] = {
        ...result[day],
        [record.id]: record
      }
    } else {
      result[day] = {
        [record.id]: record
      }
    }
  }
  const days = Object.keys(result);
  for (let j = 0; j < days.length; j++) {
    const day = days[j];
    await saveLogsByDay(day, result[day])
  }
};

export const getAllRecordsArr = async (startTime?: string, endTime?: string) => { // DD/MM/YYYY


  let dates: string[] = [];
  if (startTime && endTime) {
    dates = getDatesBetween(startTime, endTime, "DD/MM/YYYY", "DD-MM-YYYY")
  }

  const data = await new Promise(resolve => {
    let result: any = [];
    fs.readdir("C://checkin-data", async (err, files) => {
      for (let i = 0; i< files.length; i++) {
        const fileName = files[i].replace('.txt', '');
        if (dates.length) {
          if (dates.includes(fileName)) {
            const dayLogs = await getLogsByDay(fileName);
            result = [
              ...result,
              ...Object.values(dayLogs)
            ]
          }
        } else {
          const dayLogs = await getLogsByDay(fileName);
          result = [
            ...result,
            ...Object.values(dayLogs)
          ]
        }
      }
      resolve(result)
    });
  });
  return data as AttendanceRecord[];
};

export const getAllRecordsObj = async () => {
  const data = await new Promise(resolve => {
    let result: any = {};
    fs.readdir("C://checkin-data", async (err, files) => {
      for (let i = 0; i< files.length; i++) {
        const fileName = files[i].replace('.txt', '');
        const dayLogs = await getLogsByDay(fileName);
        result = {
          ...result,
          ...dayLogs
        }
      }
      resolve(result)
    });
  });

  return data as Record<string, AttendanceRecord>
};

export const clearAttendanceRecords = () => {
  fs.readdir("C://checkin-data", async (err, files) => {
    for (let i = 0; i< files.length; i++) {
      const fileName = files[i];
      fs.unlink('C://checkin-data/' + fileName, err1 => {
        if (err1) {
          log.error("[REMOVE FILE] " + err1)
        }
      })
    }
  })
  // recordStore.destroy();
  // recordStore.setState({ records: {} });
};

export const filterRecords = (
  records: AttendanceRecord[],
  options?: {
    startTime?: number;
    endTime?: number;
    onlyNotPushed?: boolean;
    onlyInEmployeeCheckinCodes?: boolean;
  }
) => {
  let result = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // startTime
    if (options?.startTime && record.timestamp < options.startTime) {
      continue
    }

    // endTime
    if (options?.endTime && record.timestamp > options.endTime) {
      continue
    }

    result.push(record)
  }
  return result

};
