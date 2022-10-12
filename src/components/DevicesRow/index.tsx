import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Row } from "antd";
import AddDeviceModal from "../AddDeviceModal";
import { DeviceSyncMethod, useDevicesRecord } from "../../store/devices";
import { styled } from "../../global";
import { t, useLanguage } from "../../store/settings/languages";
import { Events, events } from "../../utils/events";
import { useSyncing } from "../../store/settings/autoPush";
import { getSettingZkBioSystem, useSettingZkBioSystem } from "../AccessZkBioSecurityDevice/settingZkBioSystem";
import PyattDevice from "../AccessDirectlyPyattDevice";
import LegacyDevice from "../AccessDirectlyLegacyDevice";
import BioStarDevice from "../AccessBioStarDevice";
import ZkBioSecurityDevice from "../AccessZkBioSecurityDevice";
import { useSettingBioStar } from "../AccessBioStarDevice/settingBioStarSystem";
import { requestEventHikVision } from "../../store/devices/functions";
import HikDevice from "../AccessHikVisionDevice";


const DevicesRow = memo(function DevicesRow() {
  useLanguage();
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const devices = useDevicesRecord();
  const [turnSyncIP, setTurnSyncIP] = useState("");
  const syncing = useSyncing();
  const ZkBioSystem =useSettingZkBioSystem()
  const BioStarSystem = useSettingBioStar()

  // //
  // useEffect(() => {
  //   console.log("turnSyncIP && syncing ", turnSyncIP, syncing);
  //   if (turnSyncIP) {
  //     return;
  //   }
  //   const _t = setInterval(() => {
  //     events.emit(Events.MASS_SYNC);
  //   }, 18000);
  //
  //   return () => {
  //     _t && clearInterval(_t);
  //   };
  // }, [turnSyncIP]);


  useEffect(() => {
    // handle chuc nang sync khi ng dung nhan vao chu syncAll
    const handler = () => {
      if (turnSyncIP) {
        return;
      }

      const _devices = Object.values(devices || {});
      if (_devices.length) {
        setTurnSyncIP(_devices[0].ip);
      }
    };
    events.on(Events.MASS_SYNC, handler);
    return () => {
      events.off(Events.MASS_SYNC, handler);
    };
  }, [turnSyncIP, devices]);

  useEffect(() => {
    // handle TH khi ma sync xong 1 cai thi can next sang cai tiep theo
    const handler = () => {
      const _devices = Object.values(devices || {});
      const currentIndex = _devices.findIndex(item => item.ip === turnSyncIP);
      if (currentIndex > -1 && currentIndex < _devices.length) {
        if (currentIndex + 1 === _devices.length) {
          setTurnSyncIP("");
        } else {
          if (_devices[currentIndex + 1]) {
            setTurnSyncIP(_devices[currentIndex + 1].ip);
          }
        }
      }
    };
    events.on(Events.SYNC_DONE, handler);
    return () => {
      events.off(Events.SYNC_DONE, handler);
    };
  }, [turnSyncIP, devices]);

  const values = useMemo(() => {
    return {
      openModal: () => setAddDeviceModalVisible(true),
      closeModal: () => setAddDeviceModalVisible(false)
    };
  }, []);

  return (
    <>
      <Wrapper>
        {ZkBioSystem.domain && <ZkBioSecurityDevice device={ZkBioSystem}/>}
        {BioStarSystem.domain && <BioStarDevice device={BioStarSystem}/>}
        {
          Object.values(devices || {}).map((device) => {
            if (device.syncMethod === DeviceSyncMethod.PY) {
              return <PyattDevice device={device} syncTurn={device.ip === turnSyncIP} key={device.ip}/>;
            }
            if (device.syncMethod === DeviceSyncMethod.LARGE_DATASET || device.syncMethod === DeviceSyncMethod.LEGACY) {
              return <LegacyDevice device={device} syncTurn={device.ip === turnSyncIP} key={device.ip}/>;
            }
            if (device.username !== '') {
              return <HikDevice device={device} syncTurn={device.ip === turnSyncIP} key={device.ip || device.domain}/>;
            }
          })
        }
        <AddButton type={"dashed"} onClick={values.openModal}>+ {t("add_device")}</AddButton>
      </Wrapper>
      <AddDeviceModal
        visible={isAddDeviceModalVisible}
        onCancel={values.closeModal}
        onClose={values.closeModal}
      />
    </>
  );
});

export default DevicesRow;
const Wrapper = styled(Row)`
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  overflow-x: scroll;
`;

const AddButton = styled(Button)`
  height: unset;
  flex: 0 0 180px;
  align-self: stretch;
  min-height: 120px;
`;
