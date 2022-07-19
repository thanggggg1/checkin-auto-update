import constate from "constate";
import { deleteDevices, Device, syncDevices,resetDevices } from "../../store/devices";
import { useCallback, useEffect, useMemo, useState } from "react";
import useAsyncFn from "react-use/lib/useAsyncFn";
import {
  AttendanceRecord,
  filterRecords,
  getAllRecordsArr,
  isRecordExists,
  syncAttendanceRecords
} from "../../store/records";
import Fetch from "../../utils/Fetch";
import { Modal } from "antd";
import { Events, events } from "../../utils/events";
import moment from "moment";
import { FormatDateSearch, MaxEvenEachRequest } from "../../store/devices/types";
import { getDeviceById } from "../../store/devices/actions";
import { getSyncing } from "../../store/settings/autoPush";
import { timeSleep } from "../../utils/sleep";
import { requestEventLogBioStar, requestLoginDeviceBioStar } from "../../store/devices/functions";
import _ from "lodash";
import { clearSettingBioStar, getSettingBioStar, setSettingBioStar } from "./settingBioStarSystem";


const BioStarDeviceContext = (() => {
  const [Provider, use] = constate(({ device }: { device: Device }) => {
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

      let newDevice = getSettingBioStar();
      let canSync = true;
      let lastSync = newDevice.lastSync
        ? moment(newDevice.lastSync).subtract(7, "hours").format(FormatDateSearch.normal)
        : moment().subtract(1, "months").format(FormatDateSearch.start);

      let hint = "";
      while (canSync) {
        if (!newDevice.sessionId) {
          continue;
        }
        const _device = getSettingBioStar()

        let _a = moment(_device.lastSync).subtract(7, "hours").format(FormatDateSearch.normal);
        if (lastSync !== _a && _device.lastSync) {
          lastSync = _a;
        }
        const syncing = getSyncing();
        console.log("syncing in canSync ", syncing);
        if (syncing === "2" || syncing === "0") {
          await timeSleep(5);
          continue;
        }

        setSyncPercent(0);

        let rows = await requestEventLogBioStar({
          sessionId: newDevice.sessionId,
          from: lastSync,
          domain: device.domain,
          hint
        });
        if (rows === 401) {
          const res = await requestLoginDeviceBioStar({
            domain: newDevice.domain,
            username: newDevice.username,
            password: newDevice.password
          });
          if (res.error) {
            Modal.error({ title: "Đăng nhập vào máy " + device.name + " không thành công!!!" });
            return;
          } else {
            newDevice = { ...newDevice, sessionId: res.sessionId };
            setSettingBioStar(newDevice);
            rows = await requestEventLogBioStar({
              sessionId: newDevice.sessionId,
              from: lastSync,
              domain: newDevice.domain
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
          // @ts-ignore
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
        setSettingBioStar({ ..._device, syncTime: moment().valueOf() });

        if (result.length) {
          syncAttendanceRecords(result);
          lastSync = moment(result[result.length - 1].timestamp).format(FormatDateSearch.normal);
          const _currentDevice = getSettingBioStar()
          if (!_currentDevice) {
            canSync = false;
            events.emit(Events.SYNC_DONE);
            return;
          }
          if (syncing === "2" || syncing === "0") {
            continue;
          }
          setSettingBioStar({ ...newDevice, lastSync: result[result.length - 1].timestamp });
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
      const _t = setInterval(() => {
        console.log("effect sync attendance");
        syncAttendances().then();
      }, 30000);

      return () => {
        _t && clearInterval(_t);
      };
    }, []);

    const deleteDevice = useCallback(() => {
      clearSettingBioStar()
    }, []);

    return {
      device,
      syncAttendances,
      deleteDevice,
      syncPercent
    };
  });

  return {
    Provider,
    use
  };
})();

export default BioStarDeviceContext;
