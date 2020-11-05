import React, { memo } from "react";
import { styled } from "../../global";
import { Card, Tag } from "antd";
import { Device } from "../../store/devices";
import PyattDeviceContext, { PyattRealtimeStatus } from "./PyattDeviceContext";
import { t, useLanguage } from "../../store/settings/languages";

const Status = () => {
  const { realtimeStatus } = PyattDeviceContext.use();
  return (
    <InfoRow>
      Status:{" "}
      {((status) => {
        if (status === PyattRealtimeStatus.CONNECTED) return t("connected");
        if (status === PyattRealtimeStatus.PREPARING) return t("preparing");
        if (status === PyattRealtimeStatus.CONNECTING) return t("connecting");
        return t("disconnected");
      })(realtimeStatus)}
    </InfoRow>
  );
};

const SyncTag = () => {
  useLanguage();

  const { syncPercent, syncAttendances } = PyattDeviceContext.use();

  if (!syncPercent) return null;

  return (
    <Tag onClick={syncAttendances}>
      {t("sync")}: {syncPercent}%
    </Tag>
  );
};

const PyattDevice = memo(function PyattDevice({ device }: { device: Device }) {
  return (
    <PyattDeviceContext.Provider device={device}>
      <Wrapper title={device.name} size={"small"}>
        <InfoRow>IP: {device.ip}</InfoRow>
        <Status />
        <TagsWrapper>
          <SyncTag />
        </TagsWrapper>
      </Wrapper>
    </PyattDeviceContext.Provider>
  );
});

export default PyattDevice;

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
