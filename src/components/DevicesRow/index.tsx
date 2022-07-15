import React, { memo, useEffect, useMemo, useState } from "react";
import { Button, Row } from "antd";
import AddDeviceModal from "../AddDeviceModal";
import { DeviceSyncMethod, useDevicesRecord } from "../../store/devices";
import { styled } from "../../global";
import { t, useLanguage } from "../../store/settings/languages";
import { Events, events } from "../../utils/events";
import { useSyncing } from "../../store/settings/autoPush";
import { getSettingZkBioSystem, useSettingZkBioSystem } from "../../store/settings/settingZkBioSystem";
import PyattDevice from "../AccessDirectlyPyattDevice";
import LegacyDevice from "../AccessDirectlyLegacyDevice";
import BioStarDevice from "../AccessBioStarDevice";
import ZkBioSecurityDevice from "../AccessZkBioSecurityDevice";


const DevicesRow = memo(function DevicesRow() {
  useLanguage();
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const devices = useDevicesRecord();
  const [turnSyncIP, setTurnSyncIP] = useState("");
  const syncing = useSyncing();


  useEffect(() => {
    console.log("turnSyncIP && syncing ", turnSyncIP, syncing);
    if (turnSyncIP) {
      return;
    }
    const _t = setInterval(() => {
      events.emit(Events.MASS_SYNC);
    }, 18000);

    return () => {
      _t && clearInterval(_t);
    };
  }, [turnSyncIP]);


  useEffect(() => {
    // handle chuc nang sync khi ng dung nhan vao chu syncAll
    console.log("turnSyncIP && syncing ", turnSyncIP, syncing);

    const handler = () => {
      if (turnSyncIP) {
        return;
      }

      const _devices = Object.values(devices || {});
      if (_devices.length) {
        setTurnSyncIP(_devices[0].domain);
      }
    };
    events.on(Events.MASS_SYNC, handler);
    return () => {
      events.off(Events.MASS_SYNC, handler);
    };
  }, [turnSyncIP, devices]);

  useEffect(() => {
    // handle TH khi ma sync xong 1 cai thi can next sang cai tiep theo
    console.log("turnSyncIP && syncing ", turnSyncIP, syncing);

    const handler = () => {
      const _devices = Object.values(devices || {});
      const currentIndex = _devices.findIndex(item => item.domain === turnSyncIP);
      if (currentIndex > -1 && currentIndex < _devices.length) {
        if (currentIndex + 1 === _devices.length) {
          console.log("vao abc3");
          setTurnSyncIP("");
        } else {
          if (_devices[currentIndex + 1]) {
            setTurnSyncIP(_devices[currentIndex + 1].domain);
            console.log("vao abc4");
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
  console.log("turn sync ip", turnSyncIP);

  return (
    <>
      <Wrapper>
        {
          Object.values(devices).map((device) => {
            if(device.token){
              return <ZkBioSecurityDevice device={device} syncTurn={device.domain === turnSyncIP} key={device.domain}/>
            }
            if (device.syncMethod === DeviceSyncMethod.PY) {
              return <PyattDevice device={device} syncTurn={device.domain === turnSyncIP} key={device.ip}/>;
            }
            if (device.syncMethod === DeviceSyncMethod.LARGE_DATASET || device.syncMethod === DeviceSyncMethod.LEGACY) {
              return <LegacyDevice device={device} syncTurn={device.domain === turnSyncIP} key={device.ip}/>;
            } else {
              if (device.doors)
                return <BioStarDevice syncTurn={device.ip === turnSyncIP} key={device.domain} device={device}/>;
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
