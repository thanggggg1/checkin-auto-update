import constate from "constate";
import { deleteDevices, Device, useDeviceSyncMethod, syncDevices } from "../../store/devices";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsyncFn } from "react-use";
import _ from "lodash";
import { requestEventLog, requestLoginDevice } from "../../store/devices/functions";
import moment from "moment";
import { FormatDateSearch, MaxEvenEachRequest } from "../../store/devices/types";
import { Events, events } from "../../utils/events";
import {
  AttendanceRecord,
  filterRecords,
  getAllRecordsArr,
  isRecordExists,
  syncAttendanceRecords
} from "../../store/records";
import { timeSleep } from "../../utils/sleep";
import { Modal } from "antd";
import Fetch from "../../utils/Fetch";
import { getDeviceById } from "../../store/devices/actions";
import { getSyncing } from "../../store/settings/autoPush";

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

  /**
   * SYNC ATTENDANCES
   */
  const [
    { loading: isGettingAttendances },
    syncAttendances
  ] = useAsyncFn(async () => {
    if (!device.sessionId) {
      return;
    }


    let newDevice = { ...device };

    let canSync = true;
    let lastSync = newDevice.lastSync
      ? moment(newDevice.lastSync).format(FormatDateSearch.normal)
      : moment().subtract(1, "months").format(FormatDateSearch.start);

    let hint = "";
    while (canSync) {

      const syncing = getSyncing();
      if (syncing === "2" || syncing === "0") {
        return;
      }

      setSyncPercent(0);

      let rows = await requestEventLog({
        sessionId: newDevice.sessionId,
        from: lastSync,
        domain: device.domain,
        hint
      });
      if (rows === 401) {
        const res = await requestLoginDevice({
          domain: newDevice.domain,
          username: newDevice.username,
          password: newDevice.password
        });
        if (res.error) {
          Modal.error({ title: "Đăng nhập vào máy " + device.name + " không thành công!!!" });
          return;
        } else {
          newDevice = { ...newDevice, sessionId: res.sessionId };
          rows = await requestEventLog({
            sessionId: newDevice.sessionId,
            from: lastSync,
            domain: newDevice.domain,
            hint
          });
        }
      }
      if (typeof rows === "number") {
        Modal.error({ title: "Đăng nhập vào máy " + newDevice.name + " không thành công!!!" });
        return;
      }
      const result: AttendanceRecord[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (isRecordExists(row.id) || !row?.user_id?.user_id) {
          continue;
        }
        const mm = moment(row.datetime);
        result.push({
          timestamp: mm.valueOf(),
          timeFormatted: mm.format("HH:mm:ss"),
          dateFormatted: mm.format("DD/MM/YYYY"),
          deviceName: newDevice.name,
          deviceIp: newDevice.domain,
          //@ts-ignore
          uid: row.user_id.user_id,
          id: `${row.user_id.user_id}_${mm.valueOf()}`
        });
      }
      if (result.length) {
        syncAttendanceRecords(result);
        lastSync = moment(result[result.length - 1].timestamp).format(FormatDateSearch.normal);
        const _currentDevice = getDeviceById(newDevice.domain);
        if (!_currentDevice) {
          canSync = false;
          events.emit(Events.SYNC_DONE);
          return;
        }
        syncDevices([{ ...newDevice, lastSync: result[result.length - 1].timestamp }]);
        await timeSleep(3);
        await Fetch.massPushSplitByChunks(
          filterRecords(getAllRecordsArr(), {
            onlyNotPushed: true,
            onlyInEmployeeCheckinCodes: true,
            startTime: moment(result[0].timestamp).clone().startOf("day").valueOf(),
            endTime: moment(result[0].timestamp).clone().endOf("day").valueOf()
          })
        );
        await timeSleep(3);
      }
      if (rows?.length < MaxEvenEachRequest) {
        canSync = false;
        events.emit(Events.SYNC_DONE);
      }
    }

    return [];
  }, [
    device
  ]);

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
  }, [device.domain]);

  return {
    device,
    syncAttendances,
    deleteDevice,
    syncPercent
  };
};

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);
