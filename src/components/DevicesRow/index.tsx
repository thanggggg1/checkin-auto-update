import React, { memo, useMemo, useState } from "react";
import { Button, Col, Row } from "antd";
import AddDeviceModal from "../AddDeviceModal";

const DevicesRow = memo(function DevicesRow() {
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);

  const values = useMemo(() => {
    return {
      openModal: () => setAddDeviceModalVisible(true),
      closeModal: () => setAddDeviceModalVisible(false),
    };
  }, []);

  return (
    <Row>
      <Col flex={1} />
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
