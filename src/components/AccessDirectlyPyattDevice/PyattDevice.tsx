import React, { memo, useCallback } from "react";
import { styled } from "../../global";
import { Card, Tag, Dropdown, Button, Menu, Modal } from "antd";
import { Device } from "../../store/devices";
import PyattDeviceContext, { PyattRealtimeStatus } from "./PyattDeviceContext";
import { t, useLanguage } from "../../store/settings/languages";
import AddDeviceModal from "../AddDeviceModal";
import useBoolean from "../../hooks/useBoolean";
import moment from "moment";

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
        mode={'multi_mcc'}
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
        if (status === PyattRealtimeStatus.CONNECTED) return  <TextStatusConnected>{t('connected')}</TextStatusConnected>
        if (status === PyattRealtimeStatus.PREPARING) return  <TextStatusConnecting>{t('preparing')}</TextStatusConnecting>
        if (status === PyattRealtimeStatus.CONNECTING) return  <TextStatusConnecting>{t('connecting')}</TextStatusConnecting>
        return  <TextStatusDisconnected>{t('disconnected')}</TextStatusDisconnected>
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
      {t("sync")}: {syncPercent}
    </Tag>
  );
};

const PyattDevice = memo(function PyattDevice({ device, syncTurn }: { device: Device, syncTurn: boolean }) {
  return (
    <PyattDeviceContext.Provider device={device} syncTurn={syncTurn}>
      <Wrapper title={device.name} size={"small"} extra={<Extra />}>
        <InfoRow>IP: {device.ip}</InfoRow>
        <InfoRow>
          {t("newest_eventLog")}:
          {
            device?.lastSync ? <div style={{
              fontWeight: "bold",
              paddingLeft: 8
            }}>{" "}{moment(device.lastSync).format("DD-MM-YYYY HH:mm")}</div> : null
          }
        </InfoRow>
        <InfoRow>
          {t("last_auto_sync")}:
          {
            <div style={{
              fontWeight: "bold",
              paddingLeft: 8
            }}>{" "}{moment(device.syncTime).format("DD-MM-YYYY HH:mm")}</div>
          }
        </InfoRow>
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
  flex: 0 0 350px;
  width: 420px;
  height: 180px;
`;

const InfoRow = styled.div`
  margin-bottom: 0;
  display: flex;
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

export const TextStatusDisconnected = styled.div`
font-weight: bold;
padding-left: 8px;
color: red;
`
export const TextStatusConnecting = styled(TextStatusDisconnected)`
color:#2d87bb;
`
export const TextStatusConnected = styled(TextStatusDisconnected)`
color: #64ef64;

`