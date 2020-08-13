import React, { memo, useMemo, useState } from "react";
import { Button, Col, Row } from "antd";
import AddDeviceModal from "../AddDeviceModal";
import { useDevicesRecord } from "../../store/devices";
import DeviceItem from "./DeviceItem";

const DevicesRow = memo(function DevicesRow() {
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const devices = useDevicesRecord();

  const values = useMemo(() => {
    return {
      openModal: () => setAddDeviceModalVisible(true),
      closeModal: () => setAddDeviceModalVisible(false),
    };
  }, []);

  console.log({ devices });

  return (
    <Row>
      <Col flex={1}>
        {Object.values(devices).map((device) => {
          return <DeviceItem key={device.ip} device={device} />;
        })}
      </Col>
      <Col>
        <Button type={"dashed"} onClick={values.openModal}>
          Add device
        </Button>
      </Col>
      <AddDeviceModal
        visible={isAddDeviceModalVisible}
        onCancel={values.closeModal}
        onClose={values.closeModal}
      />
    </Row>
  );
});

export default DevicesRow;
