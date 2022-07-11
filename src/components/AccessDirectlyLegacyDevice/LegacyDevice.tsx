import React,{ memo } from "react";
import { Device } from "../../store/devices";
import LegacyDeviceContext, { ConnectionState } from "./LegacyDeviceContext";
import { Card } from "antd";
import styled from "styled-components";
import { t } from "../../store/settings/languages";
import DeviceItemExtra from "../DevicesRow/DeviceItemExtra";
import SyncTag from "../DevicesRow/tags/SyncTag";

const LegacyDevice = memo(function LegacyDevice({ device, syncTurn }: { device: Device, syncTurn: boolean }) {
  const {connectionState}=LegacyDeviceContext.use()
  return (
    <LegacyDeviceContext.Provider device={device} syncTurn={syncTurn}>
      <Wrapper title={device.name} size={"small"} extra={<DeviceItemExtra />}>
        <InfoRow>IP: {device.ip}</InfoRow>
        <InfoRow>
          {t("status")}:{" "}
          {(() => {
            if (connectionState === ConnectionState.CONNECTED) return t('connected');
            if (connectionState === ConnectionState.CONNECTING)
              return t("connecting");
            if (connectionState === ConnectionState.DISCONNECTED)
              return t("disconnected");
            return t("unknown");
          })()}
        </InfoRow>
        <TagsWrapper>
          <SyncTag />
        </TagsWrapper>
      </Wrapper>
    </LegacyDeviceContext.Provider>
  );
});
export default LegacyDevice
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
