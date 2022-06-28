import React, { memo, useEffect, useMemo, useState } from "react";
import { Button, Row } from "antd";
import AddDeviceModal from "../AddDeviceModal";
import { useDevicesRecord } from "../../store/devices";
import DeviceItem from "./DeviceItem";
import { styled } from "../../global";
import { t, useLanguage } from "../../store/settings/languages";
import { Events, events } from "../../utils/events";
import { useSyncing } from "../../store/settings/autoPush";
import { getSettingSystem } from "../../store/settings/settingSystem";


const DevicesRow = memo(function DevicesRow() {
  useLanguage();
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const devices = useDevicesRecord();
  const [turnSyncIP, setTurnSyncIP] = useState("");
  const syncing = useSyncing();
  const _device=getSettingSystem();

  useEffect(() => {
    console.log("turnSyncIP && syncing ", turnSyncIP, syncing);
    if (turnSyncIP && turnSyncIP === _device.domain) {
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
    const handler = () => {

      if (turnSyncIP  && turnSyncIP === _device.domain) {
        return;
      }

      const _devices = Object.values(devices || {});
      console.log('device co ko',_devices);
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
    const handler = () => {
      const _devices = Object.values(devices || {});
      const currentIndex = _devices.findIndex(item => item.domain === turnSyncIP);
      if (currentIndex > -1 && currentIndex < _devices.length) {

        if (currentIndex + 1 === _devices.length) {
          setTurnSyncIP("");
        } else {
          if (_devices[currentIndex + 1]) {
            setTurnSyncIP(_devices[currentIndex + 1].domain);
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
  console.log('turn sync ip',turnSyncIP);


  return (
    <>
      <Wrapper>
        {Object.values(devices).map((device) => {
          return <DeviceItem key={device.domain}
                             device={device}
                             syncTurn={device.domain === turnSyncIP}
          />;
        })
        }
        {
          Object.values(devices).length==0 ? <AddButton type={"dashed"} onClick={values.openModal}>
            + {t("add_device")}
          </AddButton> : null
        }

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
