import constate from "constate";
import { deleteDevices, Device, syncDevices } from "../../store/devices";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsyncFn } from "react-use";
import _ from "lodash";
import {
  requestEventLogBioStar,
  requestEventLogZkBio,
  requestLoginDeviceBioStar,
  requestLoginDeviceZkBio
} from "../../store/devices/functions";
import moment from "moment";
import { FormatDateSearch, MaxEvenEachRequest } from "../../store/devices/types";
import { Events, events } from "../../utils/events";
import { AttendanceRecord, filterRecords, getAllRecordsArr, syncAttendanceRecords } from "../../store/records";
import { timeSleep } from "../../utils/sleep";
import Fetch from "../../utils/Fetch";
import { getSyncing } from "../../store/settings/autoPush";
import { Modal } from "antd";
import { getDeviceById } from "../../store/devices/actions";
import {
  clearSettingZkBioSystem,
  getSettingZkBioSystem,
  setSettingZkBioSystem
} from "../../store/settings/settingZkBioSystem";

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
    // let BioStarDevice = { ...device };

    let canSync = true;
    //
    // let lastSyncBioStarDevices = BioStarDevice?.lastSync ?
    //   moment(BioStarDevice.lastSync).subtract(7, "hours").format(FormatDateSearch.normal)
    //   : moment().subtract(1, "months").format(FormatDateSearch.start);

    let hint = "";
    while (canSync) {
      // if (!BioStarDevice.sessionId) {
      //   continue;
      // }
      let lastSyncZkBio = "";

      let _ZkBioSystem = getSettingZkBioSystem();
      // const __device = getDeviceById(BioStarDevice.domain);

      // Lay last sync cua zkteco
      if (_ZkBioSystem.domain) {
        lastSyncZkBio = _ZkBioSystem.lastSync
          ? moment(_ZkBioSystem.lastSync).format(FormatDateSearch.normal)
          : moment().subtract(6, "months").format(FormatDateSearch.start);
      }

      // Lay last sync cua biostar
      // lastSyncBioStarDevices = moment(__device.lastSync).subtract(7, "hours").format(FormatDateSearch.normal);


      const syncing = getSyncing();

      if (syncing === "2" || syncing === "0") {
        await timeSleep(5);
        continue;
      }
      setSyncPercent(0);

      //Handle sync ZkBioSecurity
      if (_ZkBioSystem.domain && _ZkBioSystem.status === "Offline") {
        await timeSleep(10);
        await requestLoginDeviceZkBio({
          domain: _ZkBioSystem.domain,
          username: _ZkBioSystem.username,
          password: _ZkBioSystem.password
        });
        canSync = false;
        events.emit(Events.SYNC_DONE);
        continue;
      }

      _ZkBioSystem = getSettingZkBioSystem();
      console.log("systemBio", _ZkBioSystem);

      let data = await requestEventLogZkBio({
        domain: _ZkBioSystem.domain,
        startTime: lastSyncZkBio,
        endTime: moment().format(FormatDateSearch.end),
        token: _ZkBioSystem.token
      });

      //kiem tra neu token het han
      if (!data || data === 401) {
        await requestLoginDeviceZkBio({
          domain: _ZkBioSystem.domain,
          username: _ZkBioSystem.username,
          password: _ZkBioSystem.password
        });
        canSync = false;
        events.emit(Events.SYNC_DONE);
        continue;
      }
      let rowsZkBio = JSON.parse(data || "{rows: []}").rows;

      // // Handle sync BioStar
      // let rowsBioStar = await requestEventLogBioStar({
      //   sessionId: BioStarDevice.sessionId,
      //   from: lastSyncBioStarDevices,
      //   domain: device.domain,
      //   hint
      // });
      // if (rowsBioStar === 401) {
      //   const res = await requestLoginDeviceBioStar({
      //     domain: BioStarDevice.domain,
      //     username: BioStarDevice.username,
      //     password: BioStarDevice.password
      //   });
      //   if (res.error) {
      //     Modal.error({ title: "Đăng nhập vào máy " + device.name + " không thành công!!!" });
      //     return;
      //   } else {
      //     BioStarDevice = { ...BioStarDevice, sessionId: res.sessionId };
      //     syncDevices([BioStarDevice]);
      //     rowsBioStar = await requestEventLogBioStar({
      //       sessionId: BioStarDevice.sessionId,
      //       from: lastSyncBioStarDevices,
      //       domain: BioStarDevice.domain
      //     });
      //   }
      // }
      // if (typeof rowsBioStar === "number") {
      //   Modal.error({ title: "Đăng nhập vào máy " + BioStarDevice.name + " không thành công!!!" });
      //   return;
      // }


      const result: AttendanceRecord[] = [];
      // const doors = (__device?.doors || "").split(",").map(item => item.trim()).filter(Boolean);
      for (let i = 0; i < rowsZkBio.length; i++) {
        const row = rowsZkBio[i]?.data || undefined;
        if (!row || !Array.isArray(row) || row[0] <= 0) {
          continue;
        }
        const mm = moment(row[1], "YYYY-MM-DD HH:mm:ss");

        if (row[7] > 0) {
          result.push({
            timestamp: mm.valueOf(),
            timeFormatted: mm.format("HH:mm:ss"),
            dateFormatted: mm.format("DD/MM/YYYY"),
            deviceName: row[3],
            deviceIp: _ZkBioSystem.domain,
            //@ts-ignore
            uid: row[7],
            id: `${row[0]}_${mm.valueOf()}`
          });
        }
      }
      setSettingZkBioSystem({ ..._ZkBioSystem, syncTime: moment().valueOf() });
      await timeSleep(3);
      if (result.length) {
        syncAttendanceRecords(result);
        const __ZkBioSystem = getSettingZkBioSystem();

        if (__ZkBioSystem.domain) setSettingZkBioSystem({
          ...__ZkBioSystem,
          lastSync: result[result.length - 1].timestamp
        }) && syncDevices([{ ...__ZkBioSystem, lastSync: result[result.length - 1].timestamp }]);
        await timeSleep(2);

        // const _currentDevice = getDeviceById(__device.domain);
        if (!__ZkBioSystem) {
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
        await timeSleep(3);
      }
      if (rowsZkBio?.length < MaxEvenEachRequest) {
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
      console.log("effect sync attendance");
      syncAttendances().then();
    }
  }, [syncTurn]);

  const deleteDevice = useCallback(() => {
    deleteDevices([device.domain]);
    clearSettingZkBioSystem();
  }, []);


  return {
    device,
    syncAttendances,
    deleteDevice,
    syncPercent
  };
};

export const [DeviceProvider, useCurrentDevice] = constate(useDeviceValue);
