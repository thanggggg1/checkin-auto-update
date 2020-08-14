import React, { memo, useCallback, useEffect, useState } from "react";
import { Device, deleteDevices } from "../../store/devices";
import { Card, Col, Popconfirm, Popover } from "antd";
import ZK from "../../packages/js_zklib/ZK";

const DeviceItem = memo(function DeviceItem({ device }: { device: Device }) {
  // device state
  const [state, setState] = useState("Pending");
  const [realtimeState, setRealtimeState] = useState("Pending");

  const deleteDevice = useCallback(() => {
    deleteDevices([device.ip]);
  }, [device]);

  useEffect(() => {
    const connection = new ZK({
      port: device.port,
      connectionType: device.connection,
      timeout: 10000,
      inport: 5200,
      ip: device.ip,
    });

    connection.connect().then(async () => {
      setState("Connected");

      connection.zklib.socket.on("close", () => {
        setState("Closed");
        setRealtimeState("Closed");
      });

      connection.startMon({
        start: (err) => {
          if (err) return setRealtimeState("Timed out");
          setRealtimeState("Started");
        },
        onatt: (log) => {
          console.log("onatt", log);
        },
      });
    });

    return () => {
      connection.disconnect();
    };
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
        <p>Status: {state}</p>
        <p>Realtime status: {realtimeState}</p>
      </Card>
    </Col>
  );
});

export default DeviceItem;
