import React, { useCallback, useEffect, useMemo, useState } from "react";
import constate from "constate";
import { deleteDevices, Device, syncDevices,resetDevices } from "../../store/devices";
import useAsyncFn from "react-use/lib/useAsyncFn";
import { AttendanceRecord, filterRecords, syncAttendanceRecords } from "../../store/records";
import Fetch from "../../utils/Fetch";
import { Events, events } from "../../utils/events";
import moment from "moment";
import { FormatDateSearch, MaxEvenEachRequest } from "../../store/devices/types";
import { getSyncing } from "../../store/settings/autoPush";
import { timeSleep } from "../../utils/sleep";
import { requestEventLogZkBio, requestLoginDeviceZkBio } from "../../store/devices/functions";
import _ from "lodash";
import { getDeviceById } from "../../store/devices/actions";
import {
  clearSettingZkBioSystem,
  getSettingZkBioSystem,
  setSettingZkBioSystem
} from "../../store/settings/settingZkBioSystem";


const ZkBioSecurityContext = (() => {
  const [Provider, use] = constate(() => {
    const [syncPercent, _setSyncPercent] = useState(0);
    const setSyncPercent = useMemo(
      () => _.throttle(_setSyncPercent, 500, { leading: true, trailing: true }),
      [_setSyncPercent]
    );
    const newDevice = getSettingZkBioSystem();
    if (!newDevice.startSync) {
      setSettingZkBioSystem({ ...newDevice, startSync: moment().subtract(6, "months").valueOf() });
    }

    /**
     * SYNC ATTENDANCES
     */

    const [
      { loading: isGettingAttendances },
      syncAttendances
    ] = useAsyncFn(async () => {

      let canSync = true;

      while (canSync) {
        // if (!newDevice.sessionId) {
        //   continue;
        // }
        let _device=getSettingZkBioSystem()
        if (!_device.domain) {
          canSync = false;
        }

        let lastSync = _device.lastSync
          ? moment(_device.lastSync).format(FormatDateSearch.normal)
          : moment().subtract(6, "months").format(FormatDateSearch.start);

        const syncing = getSyncing();

        if (syncing === "2" || syncing === "0") {
          await timeSleep(5);
          continue;
        }
        setSyncPercent(0);

        if (_device.domain && _device.status === "Offline") {
          await timeSleep(15);
          await requestLoginDeviceZkBio({
            domain: _device.domain,
            username: _device.username,
            password: _device.password,
            device: _device
          });
          canSync = false;
          events.emit(Events.SYNC_DONE);
          continue;
        }

        console.log("LAST SYNCC", lastSync);

        _device=getSettingZkBioSystem()


        let data = await requestEventLogZkBio({
          domain: _device.domain,
          startTime: lastSync,
          endTime: moment().format(FormatDateSearch.end),
          token: _device.token
        });


        //kiem tra neu token het han
        if (!data || data === 401) {
          await requestLoginDeviceZkBio({
            domain: _device.domain,
            username: _device.username,
            password: _device.password,
            device: _device
          });
          canSync = false;
          events.emit(Events.SYNC_DONE);
          continue;
        }
        let rows = JSON.parse(data || "{rows: []}").rows;

        console.log("length", rows.length);

        const result: AttendanceRecord[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]?.data || undefined;
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
              deviceIp: _device.domain,
              //@ts-ignore
              uid: row[7],
              id: `${row[0]}_${mm.valueOf()}`
            });
          }
        }
        setSettingZkBioSystem({..._device,syncTime:moment().valueOf()})

        if (result.length) {
          console.log("time last sync", moment(result[result.length - 1].timestamp).format(FormatDateSearch.normal));

          syncAttendanceRecords(result);
          const __device = getSettingZkBioSystem()
          __device && setSettingZkBioSystem({...__device, lastSync: result[result.length - 1].timestamp})

          await timeSleep(2);

          // const _currentDevice = getDeviceById(__device.domain);
          if (!__device) {
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
          await timeSleep(3);
        }
        if (rows?.length < MaxEvenEachRequest) {
          canSync = false;
          events.emit(Events.SYNC_DONE);
        }
      }
      return [];
    }, []);

    useEffect(() => {
      if (isGettingAttendances) {
        return;
      }
      const _t = setInterval(() => {
        syncAttendances().then();
          }, 18000);

          return () => {
            clearInterval(_t);
          };
    }, []);
    //

    const deleteDevice = useCallback(() => {
     clearSettingZkBioSystem();
     resetDevices()
    }, []);

    return {
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

export default ZkBioSecurityContext;
