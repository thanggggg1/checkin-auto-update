import constate from "constate";
import { deleteDevices, Device, syncDevices } from "../../store/devices";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsyncFn } from "react-use";
import _ from "lodash";
import { requestEventLog, requestLoginDevice } from "../../store/devices/functions";
import moment from "moment";
import { FormatDateSearch, MaxEvenEachRequest } from "../../store/devices/types";
import { Events, events } from "../../utils/events";
import { AttendanceRecord, filterRecords, getAllRecordsArr, syncAttendanceRecords } from "../../store/records";
import { timeSleep } from "../../utils/sleep";
import Fetch from "../../utils/Fetch";
import { getDeviceById } from "../../store/devices/actions";
import { getSyncing } from "../../store/settings/autoPush";
import { clearSettingDevice, getSettingDevice, setSettingDevice } from "../../store/settings/settingDevice";

export enum ConnectionState {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
}

const useDeviceValue = ({ device, syncTurn }: { syncTurn: boolean, device: Device }) => {
  const [syncPercent, _setSyncPercent] = useState(0);
  const setSyncPercent = useMemo(
    () => _.throttle(_setSyncPercent, 500, { leading: true, trailing: true }),
    [_setSyncPercent]
  );
  const __device = { ...device };
  console.log("co device ko", __device);
  if (!__device.startSync) {
    setSettingDevice({ ...__device, startSync: moment().subtract(6, "months").valueOf() });
  }

  /**
   * SYNC ATTENDANCES
   */

  const [
    { loading: isGettingAttendances },
    syncAttendances
  ] = useAsyncFn(async () => {

    let newDevice = { ...device };
    let canSync = true;

    let lastSync = newDevice.lastSync
      ? moment(newDevice.lastSync).format(FormatDateSearch.normal)
      : moment().subtract(6, "months").format(FormatDateSearch.start);

    while (canSync) {
      // if (!newDevice.sessionId) {
      //   continue;
      // }
      const _device = getSettingDevice();
      let _a = moment(_device.lastSync).format(FormatDateSearch.normal);

      if (lastSync !== _a && _device.lastSync) {
        lastSync = _a;
      }

      if (_device.status === "Offline") {
        await timeSleep(10);
        await requestLoginDevice({
          domain: _device.domain,
          username: _device.username,
          password: _device.password
        });
        events.emit(Events.SYNC_DONE);
        continue;
      }
      // lastSync = moment(device.lastSync).format(FormatDateSearch.normal);

      const syncing = getSyncing();

      if (syncing === "2" || syncing === "0") {
        await timeSleep(5);
        continue;
      }
      setSyncPercent(0);
      console.log("LAST SYNCC", lastSync);

      let data = await requestEventLog({
        domain: _device.domain,
        startTime: lastSync,
        endTime: moment().format(FormatDateSearch.end),
        token: _device.token
      });
      //kiem tra neu token het han
      if (!data || data === 401) {
        await requestLoginDevice({
          domain: _device.domain,
          username: _device.username,
          password: _device.password
        });
        events.emit(Events.SYNC_DONE);
        continue;
      }
      let rows = JSON.parse(data || "{rows: []}").rows;
      console.log("length", rows.length);

      // if (rows === 401) {
      //   const res = await requestLoginDevice({
      //     domain: newDevice.domain,
      //     username: newDevice.username,
      //     password: newDevice.password
      //   });
      //   if (res.error) {
      //     Modal.error({ title: "Đăng nhập vào máy " + device.name + " không thành công!!!" });
      //     return;
      //   } else {
      //     newDevice = { ...newDevice, sessionId: res.sessionId };
      //     syncDevices([newDevice]);
      //     rows = await requestEventLog({
      //       sessionId: newDevice.sessionId,
      //       from: lastSync,
      //       domain: newDevice.domain
      //     });
      //   }
      // }
      // if (typeof rows === "number") {
      //   Modal.error({ title: "Đăng nhập vào máy " + newDevice.name + " không thành công!!!" });
      //   return;
      // }
      const result: AttendanceRecord[] = [];
      const doors = (_device?.doors || "").split(",").map(item => item.trim()).filter(Boolean);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].data;
        if (!row || row[0] <= 0) {
          continue;
        }
        const mm = moment(row[1], "YYYY-MM-DD HH:mm:ss");

        // if (isRecordExists(row.id) || !row?.user_id?.user_id) {
        //   continue;
        // }
        //
        // if (doors?.length && row?.device_id?.id) {
        //   if ((doors || []).indexOf(row?.device_id?.id) === -1) {
        //     continue;
        //   }
        // }
        if (row[7] > 0) {
          result.push({
            timestamp: mm.valueOf(),
            timeFormatted: mm.format("HH:mm:ss"),
            dateFormatted: mm.format("DD/MM/YYYY"),
            deviceName: row[3],
            deviceIp: _device.domain,
            //@ts-ignore
            uid: row[7],
            id: `${row[0]}_${mm.valueOf()}`
          });
        }
      }

      setSettingDevice({ ..._device, syncTime: moment().valueOf() });
      if (result.length) {
        syncAttendanceRecords(result);
        await timeSleep(0.5);
        const __device = getSettingDevice();
        __device && syncDevices([{
          ...__device,
          lastSync: result[result.length - 1].timestamp
        }]) && setSettingDevice({ ...__device, lastSync:result[result.length - 1].timestamp });


        const _currentDevice = getDeviceById(newDevice.domain);
        if (!_currentDevice) {
          canSync = false;
          events.emit(Events.SYNC_DONE);
          return;
        }
        if (syncing === "2" || syncing === "0") {
          continue;
        }
        await timeSleep(3);
        try {
          await Fetch.massPushSplitByChunks(
            filterRecords(getAllRecordsArr(), {
              onlyNotPushed: true,
              onlyInEmployeeCheckinCodes: true,
              startTime: moment(result[0].timestamp).clone().startOf("day").valueOf(),
              endTime: moment(result[0].timestamp).clone().endOf("day").valueOf()
            })
          );
        } catch (e) {

        }
        await timeSleep(3);
      } else {
        console.log("come here when result = 0");
        await timeSleep(3);
        console.log("vao dayyyyyy");
      }
      if (rows?.length < MaxEvenEachRequest) {
        canSync = false;
        events.emit(Events.SYNC_DONE);
      }
    }
    return [];
  }, [device]);

  useEffect(() => {
    if (isGettingAttendances) {
      return;
    }
    if (syncTurn) {
      syncAttendances().then();
    }
  }, [syncTurn]);

  const deleteDevice = useCallback(() => {
     deleteDevices([device.domain]);
     clearSettingDevice();
  }, [device.domain]);

  // const [{loading},deleteDevice]=useAsyncFn(async ()=>{
  //   await deleteDevices([device.domain]);
  //   await clearSettingDevice();
  // },[device.domain])

  return {
    device,
    syncAttendances,
    deleteDevice,
    syncPercent
  };
};

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);
