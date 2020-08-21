import React, { memo } from "react";
import { Device } from "../../store/devices";
import { Card, Popover } from "antd";
import { styled } from "../../global";
import DeviceItemExtra from "./DeviceItemExtra";
import { ConnectionState, DeviceProvider, useCurrentDevice } from "./context";
import SyncTag from "./tags/SyncTag";

const Wrapper = styled(Card)`
  flex: 0 0 220px;
`;

const InfoRow = styled.p`
  margin-bottom: 0;
`;

const TagsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: scroll;
`;

const DeviceInfo = memo(function DeviceInfo() {
  const { device, state, realtimeState } = useCurrentDevice();

  return (
    <Wrapper title={device.name} size={"small"} extra={<DeviceItemExtra />}>
      <InfoRow>IP: {device.ip}</InfoRow>
      <Popover
        content={
          <div>
            <p>
              Pending: This app is trying to connect to the device
              <br />
              Connected: This app is connected to this device
              <br />
              Closed: The connection is closed, this app will auto connect later
              <br />
              Refused: The device is refused this app to connect, maybe another
              app is connected to this device
              <br />
              Host down: Cannot connect to the device, please check the
              connection
              <br />
              Timeout: The device take so long to response, or have no response
              at all
              <br />
              Connection reset: The device closed this connection.
              <br />
              Host unreach: Cannot reach to the device
            </p>
          </div>
        }
      >
        <InfoRow>
          Status:{" "}
          {(() => {
            if (state === ConnectionState.CONNECTED) return "Connected";
            if (state === ConnectionState.CLOSED) return "Closed";
            if (state === ConnectionState.REFUSED) return "Refused";
            if (state === ConnectionState.HOSTDOWN) return "Host down";
            if (state === ConnectionState.PENDING) return "Pending";
            if (state === ConnectionState.TIMEOUT) return "Timed out";
            if (state === ConnectionState.RESET) return "Connection reset";
            if (state === ConnectionState.EHOSTUNREACH) return "Host unreach";
            return "";
          })()}
        </InfoRow>
      </Popover>
      <InfoRow>Realtime status: {realtimeState}</InfoRow>

      <TagsWrapper>
        <SyncTag />
      </TagsWrapper>
    </Wrapper>
  );
});

const DeviceItem = memo(function DeviceItem({ device }: { device: Device }) {
  return (
    <DeviceProvider device={device}>
      <DeviceInfo />
    </DeviceProvider>
  );
});

export default DeviceItem;
