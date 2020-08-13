import React, { memo, useCallback, useMemo, useState } from "react";
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
          <AddDeviceModal
            visible={isAddDeviceModalVisible}
            onCancel={values.closeModal}
          />
        </Button>
      </Col>
    </Row>
  );
});

export default DevicesRow;
