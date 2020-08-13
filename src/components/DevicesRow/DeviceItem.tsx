import React, { memo, useCallback } from "react";
import { Device, deleteDevices } from "../../store/devices";
import { Card, Col, Popconfirm, Popover } from "antd";

const DeviceItem = memo(function DeviceItem({ device }: { device: Device }) {
  const deleteDevice = useCallback(() => {
    deleteDevices([device.ip]);
  }, [device]);

  return (
    <Col span={8}>
      <Card
        title={device.name}
        size={"small"}
        extra={
          <Popconfirm
            title={"Are you sure to delete this device?"}
            onConfirm={deleteDevice}
          >
            <a>Delete</a>
          </Popconfirm>
        }
      >
        <p>IP: {device.ip}</p>
        <p>Status: Not implemented</p>
      </Card>
    </Col>
  );
});

export default DeviceItem;
