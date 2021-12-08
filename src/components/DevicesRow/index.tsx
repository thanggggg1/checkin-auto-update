import React, { memo, useMemo, useState } from "react";
import { Button, Row } from "antd";
import AddDeviceModal from "../AddDeviceModal";
import { DeviceSyncMethod, useDevicesRecord } from "../../store/devices";
import DeviceItem from "./DeviceItem";
import { styled } from "../../global";
import { t, useLanguage } from "../../store/settings/languages";
import PyattDevice from "../PyattDevice";

const Wrapper = styled(Row)`
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  overflow-x: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
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

  console.log('devices ', devices);
  const values = useMemo(() => {
    return {
      openModal: () => setAddDeviceModalVisible(true),
      closeModal: () => setAddDeviceModalVisible(false),
    };
  }, []);

  return (
    <>
      <Wrapper>
        {Object.values(devices).map((device) => {
          if (device.syncMethod === DeviceSyncMethod.PY) {
            return <PyattDevice key={device.ip} device={device} />;
          }

          return <DeviceItem key={device.ip} device={device} />;
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
