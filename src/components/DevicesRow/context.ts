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
import { AttendanceRecord, filterRecords, getAllRecordsArr, syncAttendanceRecords, isRecordExists } from "../../store/records";
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
import ZK from "../../packages/js_zklib/ZK";
import useAsyncEffect from "../../utils/useAsyncEffect";
import useAutoMessageError from "../../hooks/useAutoMessageError";

export enum ConnectionState {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
}

const useDeviceValue = ({ device, syncTurn }: { syncTurn: boolean, device: Device }) => {
  const [syncPercent, _setSyncPercent] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const setSyncPercent = useMemo(
    () => _.throttle(_setSyncPercent, 500, { leading: true, trailing: true }),
    [_setSyncPercent]
  );

  /** CONNECT MULTI_MCC
   */

  const connection = useMemo(() => {
    return new ZK({
      ip: device.ip,
      timeout: device.timeout || 60000,
      inport: device.inport || 5200,
      port: device.port,
      connectionType: device.connection,
    });
  }, [
    device.ip,
    device.timeout,
    device.inport,
    device.port,
    device.connection,
  ]);

  /**
   * CONNECT
   */
  const {
    loading: connecting,
    error: connectError,
    call: connect,
  } = useAsyncEffect(async () => {
    setConnectionState(ConnectionState.CONNECTING);
    try {
      await connection.connect();
      setConnectionState(ConnectionState.CONNECTED);
    } catch (e) {
      setConnectionState(ConnectionState.DISCONNECTED);
      throw e;
    }
  }, [connection]);

  useAutoMessageError(connectError);

  const canSendRequest =
    !connecting &&
    !connectError &&
    connectionState === ConnectionState.CONNECTED;

  /**
   * DISABLE
   */
  const [{ error: disableError }, disableDevice] = useAsyncFn(async () => {
    if (!canSendRequest) {
      throw new Error("Socket is not connected");
    }
    console.log('disable device ', connection);

    await connection.disableDevice();
  }, [canSendRequest, connection]);

  useAutoMessageError(disableError);

  /**
   * ENABLE
   */
  const [{ error: enableError }, enableDevice] = useAsyncFn(async () => {
    if (!canSendRequest) {
      throw new Error("Socket is not connected");
    }

    await connection.enableDevice();
  }, [connection, canSendRequest]);

  useAutoMessageError(enableError);

  /**
   * SYNC ATTENDANCES
   */

  const [
    { loading: isGettingAttendances },
    syncAttendances
  ] = useAsyncFn(async () => {

    if (connectionState !== ConnectionState.CONNECTED) {
      events.emit(Events.SYNC_DONE);
      return
    }
    const currentYear = new Date().getFullYear();
    setSyncPercent(0);

    if (!canSendRequest) {
      console.log('canSendRequest events.emit(Events.SYNC_DONE); ', canSendRequest);
      await require("bluebird").delay(400);
      // when sync done thi goi vao day de chuyen sang client tiep theo
      events.emit(Events.SYNC_DONE);
      throw new Error("Socket is not connected");
    }

    setSyncPercent(0.01);

    await disableDevice();

    setSyncPercent(0.02);


    let BioStarDevice = { ...device };

    let canSync = true;
    //
    let lastSyncBioStarDevices = BioStarDevice?.lastSync ?
      moment(BioStarDevice.lastSync).subtract(7, "hours").format(FormatDateSearch.normal)
      : moment().subtract(1, "months").format(FormatDateSearch.start);

    let hint = "";
    console.log('canSyc',canSync)
    while (canSync) {
      // if (!BioStarDevice.sessionId) {
      //   canSync=false
      //   events.emit(Events.SYNC_DONE);
      //   continue;
      // }
      let lastSyncZkBio = "";

      let _ZkBioSystem = getSettingZkBioSystem();


      const __device = getDeviceById(BioStarDevice.domain);

      // Lay last sync cua zkteco
      if(_ZkBioSystem.domain){
        lastSyncZkBio = _ZkBioSystem.lastSync
          ? moment(_ZkBioSystem.lastSync).format(FormatDateSearch.normal)
          : moment().subtract(6, "months").format(FormatDateSearch.start);
      }


      // Lay last sync cua biostar
     if (__device) lastSyncBioStarDevices = moment(__device.lastSync).subtract(7, "hours").format(FormatDateSearch.normal);
      console.log('avasvdads');


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

      console.log('lastSync',lastSyncZkBio);
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
        console.log('vao day');
        canSync = false;
        events.emit(Events.SYNC_DONE);
        continue;
      }
      let rowsZkBio = JSON.parse(data || "{rows: []}").rows;

      // Handle sync BioStar
      let rowsBioStar = await requestEventLogBioStar({
        sessionId: BioStarDevice.sessionId,
        from: lastSyncBioStarDevices,
        domain: device.domain,
        hint
      });
      if (rowsBioStar === 401) {
        const res = await requestLoginDeviceBioStar({
          domain: BioStarDevice.domain,
          username: BioStarDevice.username,
          password: BioStarDevice.password
        });
        if (res.error) {
          Modal.error({ title: "Đăng nhập vào máy " + device.name + " không thành công!!!" });
          return;
        } else {
          BioStarDevice = { ...BioStarDevice, sessionId: res.sessionId };
          syncDevices([BioStarDevice]);
          rowsBioStar = await requestEventLogBioStar({
            sessionId: BioStarDevice.sessionId,
            from: lastSyncBioStarDevices,
            domain: BioStarDevice.domain
          });
        }
      }
      if (typeof rowsBioStar === "number") {
        Modal.error({ title: "Đăng nhập vào máy " + BioStarDevice.name + " không thành công!!!" });
        return;
      }


      const result: AttendanceRecord[] = [];
      const doors = (__device?.doors || "").split(",").map(item => item.trim()).filter(Boolean);
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

      //sync data tu biostar vao result
      for (let i = 0; i < rowsBioStar.length; i++) {
        const rowsBioStarElement = rowsBioStar[i];
        if (!rowsBioStarElement) {
          continue;
        }
        const mm = moment(rowsBioStarElement.datetime);

        if (isRecordExists(rowsBioStarElement.id) || !rowsBioStarElement?.user_id?.user_id) {
          continue;
        }

        if (doors?.length && rowsBioStarElement?.device_id?.id) {
          if ((doors || []).indexOf(rowsBioStarElement?.device_id?.id) === -1) {
            continue;
          }
        }

        result.push({
          timestamp: mm.valueOf(),
          timeFormatted: mm.format("HH:mm:ss"),
          dateFormatted: mm.format("DD/MM/YYYY"),
          deviceName: BioStarDevice.name,
          deviceIp: BioStarDevice.domain,
          //@ts-ignore
          uid: rowsBioStarElement.user_id.user_id,
          id: `${rowsBioStarElement.user_id.user_id}_${mm.valueOf()}`
        });
      }

      setSettingZkBioSystem({ ..._ZkBioSystem, syncTime: moment().valueOf() });

      if (rowsBioStar && rowsBioStar.length) {
        syncDevices([{ ...__device, lastSync: moment(rowsBioStar[rowsBioStar.length - 1].datetime).valueOf() }]);
      }

      await timeSleep(3);
      if (result.length) {
        syncAttendanceRecords(result);
        const __ZkBioSystem = getSettingZkBioSystem();

        if (__ZkBioSystem.domain) setSettingZkBioSystem({
          ...__ZkBioSystem,
          lastSync: result[result.length - 1].timestamp
        })
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
