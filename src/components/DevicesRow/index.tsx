import React, { memo, useEffect, useMemo, useState } from "react";
import { Button, Row } from "antd";
import AddDeviceModal from "../AddDeviceModal";
import { DeviceSyncMethod, useDevicesRecord } from "../../store/devices";
import DeviceItem from "./DeviceItem";
import { styled } from "../../global";
import { t, useLanguage } from "../../store/settings/languages";
import PyattDevice from "../PyattDevice";
import { Events, events } from "../../utils/events";

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
`;

const DevicesRow = memo(function DevicesRow() {
  useLanguage();
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const devices = useDevicesRecord();

  const [turnSyncIP, setTurnSyncIP] = useState("");


  useEffect(() => {
    // handle chuc nang sync khi ng dung nhan vao chu syncAll
    const handler = () => {
      console.log('turnSyncIP MASS_SYNC CREATE', turnSyncIP)
      if (turnSyncIP) {
        return
      }

      const _devices = Object.values(devices || {});
      if (_devices.length) {
        setTurnSyncIP(_devices[0].ip)
      }
    };

    events.on(Events.MASS_SYNC, handler);
    return () => {
      events.off(Events.MASS_SYNC, handler);
    };
  }, [turnSyncIP]);

  useEffect(() => {
    // handle TH khi ma sync xong 1 cai thi can next sang cai tiep theo
    const handler = () => {
      const _devices = Object.values(devices || {});
      const currentIndex = _devices.findIndex(item =>item.ip === turnSyncIP);
      if (currentIndex > -1 && currentIndex < _devices.length) {

        if (currentIndex + 1 === _devices.length) {
          setTurnSyncIP("")
        } else {
          if (_devices[currentIndex + 1]) {
            setTurnSyncIP(_devices[currentIndex + 1].ip)
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
        {Object.values(devices).map((device) => {
          if (device.syncMethod === DeviceSyncMethod.PY) {
            return <PyattDevice
              key={device.ip}
              device={device}
              syncTurn={device.ip === turnSyncIP}
            />;
          }

          return <DeviceItem key={device.ip}
                             device={device}
                             syncTurn={device.ip === turnSyncIP}
          />;
        })}
        <AddButton type={"dashed"} onClick={values.openModal}>
          + {t("add_device")}
        </AddButton>
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
