import React, { memo, useCallback } from "react";
import { styled } from "../../global";
import { Card, Tag, Dropdown, Button, Menu, Modal } from "antd";
import { Device } from "../../store/devices";
import PyattDeviceContext, { PyattRealtimeStatus } from "./PyattDeviceContext";
import { t, useLanguage } from "../../store/settings/languages";
import useBoolean from "../../hooks/useBoolean";
import AddDeviceModal from "../AddDeviceModal";

const ExtraOverlay = (props: any) => {
  const {
    realtimeStatus,
    syncAttendances,
    syncPercent,
    device,
    deleteDevice,
    startRealtime,
  } = PyattDeviceContext.use();

  const [isEditDeviceVisible, showEditDevice, hideEditDevice] = useBoolean();

  const onClickDeleteDevice = useCallback(() => {
    Modal.confirm({
      title: t("delete_device_confirmation"),
      onOk: deleteDevice,
    });
  }, [deleteDevice]);

  return (
    <Menu {...props}>
      <Menu.Item onClick={startRealtime}>
        <span>{t("reconnect")}</span>
      </Menu.Item>
      <Menu.Item
        disabled={
          realtimeStatus !== PyattRealtimeStatus.CONNECTED || !!syncPercent
        }
        onClick={syncAttendances}
      >
        <span>{t("sync_attendances")}</span>
      </Menu.Item>

      <Menu.Item onClick={showEditDevice}>
        <span>{t("edit")}</span>
      </Menu.Item>
      <AddDeviceModal
        onClose={hideEditDevice}
        visible={isEditDeviceVisible}
        device={device}
      />

      <Menu.Item onClick={onClickDeleteDevice}>
        <span>{t("delete")}</span>
      </Menu.Item>
    </Menu>
  );
};

const Extra = () => {
  return (
    <Dropdown overlay={<ExtraOverlay />} placement={"bottomLeft"} arrow>
      <Button>...</Button>
    </Dropdown>
  );
};

const Status = () => {
  const { realtimeStatus } = PyattDeviceContext.use();
  return (
    <InfoRow>
      {t("status") + ": "}
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
      <Wrapper title={device.name} size={"small"} extra={<Extra />}>
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
