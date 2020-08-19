import React, { memo } from "react";
import { Device } from "../../store/devices";
import { Card } from "antd";
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
      <InfoRow>
        Status:{" "}
        {(() => {
          if (state === ConnectionState.CONNECTED) return "Connected";
          if (state === ConnectionState.CLOSED) return "Closed";
          if (state === ConnectionState.PENDING) return "Pending";
          return "";
        })()}
      </InfoRow>
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
