import React, { memo, useMemo, useState } from "react";
import { Button, Col, Row } from "antd";
import AddDeviceModal from "../AddDeviceModal";
import { useDevicesRecord } from "../../store/devices";
import DeviceItem from "./DeviceItem";
import { styled } from "../../global";

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
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const devices = useDevicesRecord();

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
          return <DeviceItem key={device.ip} device={device} />;
        })}
        <AddButton type={"dashed"} onClick={values.openModal}>
          + Add device
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
