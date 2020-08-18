import React, { memo, useEffect, useState } from "react";
import { Device, syncDevices } from "../../store/devices";
import { Card, Row } from "antd";
import ZK from "../../packages/js_zklib/ZK";
import { styled } from "../../global";
import DeviceItemExtra from "./DeviceItemExtra";
import { DeviceProvider } from "./context";
import { useAsyncRetry, useUpdateEffect } from "react-use";
import SyncTag from "./tags/SyncTag";

const Wrapper = styled(Card)`
  flex: 0 0 220px;
`;

const InfoRow = styled.p`
  margin-bottom: 0;
`;

const DeviceItem = memo(function DeviceItem({ device }: { device: Device }) {
  // device state
  const [state, setState] = useState("Pending");
  const [realtimeState, setRealtimeState] = useState("Pending");

  const [connection, setConnection] = useState<ZK>(() => {
    return new ZK({
      port: device.port,
      connectionType: device.connection,
      timeout: 10000,
      inport: 5200,
      ip: device.ip,
    });
  });

  useUpdateEffect(() => {
    setConnection(
      new ZK({
        port: device.port,
        connectionType: device.connection,
        timeout: 5000,
        inport: 5200,
        ip: device.ip,
      })
    );
  }, [device]);

  useEffect(() => {
    let interval = 0;
    connection.connect().then(async () => {
      setState("Connected");

      // @todo clear
      connection.zklib.socket.on("close", () => {
        setState("Closed");
        setRealtimeState("Closed");
      });

      setRealtimeState("Pending");
      interval = setInterval(() => {
        connection.startMon({
          start: (err) => {
            if (err) return setRealtimeState("Timed out");
            setRealtimeState("Started");
          },
          onatt: (log) => {
            console.log("onatt", log);
          },
        });
      }, 3000);
    });

    return () => {
      clearInterval(interval);
      connection.disconnect();
    };
  }, [connection]);

  useEffect(() => {
    let interval = 0;
    if (state !== "Connected") {
      interval = setInterval(() => {
        connection.connect();
      }, 3000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [state]);

  return (
    <DeviceProvider device={device} connection={connection}>
      <Wrapper title={device.name} size={"small"} extra={<DeviceItemExtra />}>
        <InfoRow>IP: {device.ip}</InfoRow>
        <InfoRow>Status: {state}</InfoRow>
        <InfoRow>Realtime status: {realtimeState}</InfoRow>

        <Row>
          <SyncTag />
        </Row>
      </Wrapper>
    </DeviceProvider>
  );
});

export default DeviceItem;
