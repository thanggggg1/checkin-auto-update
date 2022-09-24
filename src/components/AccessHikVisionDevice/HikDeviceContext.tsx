import constate from "constate";
import { deleteDevices, Device, syncDevices } from "../../store/devices";
import { useCallback, useEffect, useState } from "react";
import useLatest from "react-use/lib/useLatest";
import useAsyncFn from "react-use/lib/useAsyncFn";
import { AttendanceRecord, filterRecords, syncAttendanceRecords } from "../../store/records";
import Fetch from "../../utils/Fetch";
import { Events, events } from "../../utils/events";
import moment from "moment";
import { FormatDateSearchHikVision, MaxEvenEachRequest } from "../../store/devices/types";
import { getSyncing } from "../../store/settings/autoPush";
import { timeSleep } from "../../utils/sleep";
import { requestEventHikVision } from "../../store/devices/functions";
import { getDeviceById } from "../../store/devices/actions";


const HikDeviceContext = (() => {
  const [Provider, use] = constate(({ device, syncTurn }: { device: Device, syncTurn: boolean }) => {

    const [syncPercent, setSyncPercent] = useState("");
    const latestSyncPercent = useLatest(syncPercent);

    let _newDevice = {...device}
    if (!_newDevice.startSync && _newDevice.username) {
      syncDevices([{ ..._newDevice, startSync: moment().subtract(1, "months").valueOf() }]);
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


      const _device = getDeviceById(newDevice.ip);

      let lastSync = _device.lastSync
        ? moment(_device.lastSync).format(FormatDateSearchHikVision.normal)
        : moment().subtract(1, "months").format(FormatDateSearchHikVision.start);
      const syncing = getSyncing();

      if (syncing === "2" || syncing === "0") {
        console.log("sync", syncing);
        await timeSleep(5);
        return;
      }

      // @ts-ignore
      setSyncPercent(0);
      console.log("lastSync", moment(lastSync).format(FormatDateSearchHikVision.normal));
      let data = await requestEventHikVision({
        ip: _device.ip,
        port: _device.port,
        username: _device.username,
        password: _device.password,
        startTime: lastSync,
        endTime: moment().format(FormatDateSearchHikVision.end)
      });
      //2022-09-15T00:00:00+07:00

      let rows = JSON.parse(data || "{AcsEvent: {InfoList:[]}}").AcsEvent.InfoList;
      // if (rows === 401) {
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

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) {
          continue;
        }
        const mm = moment(row.time);

        // if (isRecordExists(row.id) || !row?.user_id?.user_id) {
        //   continue;
        // }

        // if (doors?.length && row?.device_id?.id) {
        //   if ((doors || []).indexOf(row?.device_id?.id) === -1) {
        //     continue;
        //   }
        // }
        if (row.employeeNoString) {
          result.push({
            timestamp: mm.valueOf(),
            timeFormatted: mm.format("HH:mm:ss"),
            dateFormatted: mm.format("DD/MM/YYYY"),
            deviceName: newDevice.name,
            deviceIp: newDevice.ip,
            //@ts-ignore
            uid: row.employeeNoString,
            id: `${row.serialNo}`
          });
        }
      }

      if (rows && rows.length) {
        console.log("sync vao day");
        syncDevices([{ ..._device, lastSync: moment(rows[rows.length - 1].time).valueOf() }]);
      }

      if (result.length) {
        syncAttendanceRecords(result);
        const _currentDevice = getDeviceById(newDevice.ip);
        if (!_currentDevice) {
          canSync = false;
          events.emit(Events.SYNC_DONE);
          return;
        }
        await timeSleep(3);
        try {
          await Fetch.massPushSplitByChunks(
            filterRecords(result, {
              onlyNotPushed: true,
              onlyInEmployeeCheckinCodes: true,
              startTime: result[0].timestamp,
              endTime: result[result.length - 1].timestamp
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
      }, 1000 * 15);

      return () => {
        console.log("test vong lap");
        _t && clearInterval(_t);

      };
    }, []);

    const deleteDevice = useCallback(() => {
      deleteDevices([device.ip]);
    }, [device.ip]);


    return {
      device,
      syncPercent,
      syncAttendances,
      deleteDevice
    };
  });

  return {
    Provider,
    use
  };
})();

export default HikDeviceContext;
