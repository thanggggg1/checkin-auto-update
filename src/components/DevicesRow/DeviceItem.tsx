import React, { memo } from "react";
import { Device } from "../../store/devices";
import { Card } from "antd";
import { styled } from "../../global";
import DeviceItemExtra from "./DeviceItemExtra";
import { ConnectionState, DeviceProvider, useCurrentDevice } from "./context";
import SyncTag from "./tags/SyncTag";
import { t, useLanguage } from "../../store/settings/languages";

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
  &::-webkit-scrollbar {
    display: none;
  }
`;

const DeviceInfo = memo(function DeviceInfo() {
  useLanguage();
  const { device, connectionState, freeSizes } = useCurrentDevice();

  return (
    <Wrapper title={device.name} size={"small"} extra={<DeviceItemExtra />}>
      <InfoRow>IP: {device.ip}</InfoRow>
      <InfoRow>
        {[
          t('logs', {count: freeSizes.logs || 0}),
          t('users', {count: freeSizes.users || 0}),
          Math.floor(
            ((freeSizes.logs || 0) / (freeSizes.capacity || 1)) * 10000
          ) /
            100 +
            "% " + t('used'),
        ].join(" - ")}
      </InfoRow>
      <InfoRow>
        {t('status')}:{" "}
        {(() => {
          if (connectionState === ConnectionState.CONNECTED) return "Connected";
          if (connectionState === ConnectionState.CONNECTING)
            return t('connecting');
          if (connectionState === ConnectionState.DISCONNECTED)
            return t('connected');
          return t('unknown');
        })()}
      </InfoRow>

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
