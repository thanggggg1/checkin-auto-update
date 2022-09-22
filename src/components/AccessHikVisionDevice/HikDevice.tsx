import React, { memo, useCallback } from "react";
import { styled } from "../../global";
import { Card, Tag, Dropdown, Button, Menu, Modal } from "antd";
import { Device } from "../../store/devices";
import { t, useLanguage } from "../../store/settings/languages";
import AddDeviceModal from "../AddDeviceModal";
import useBoolean from "../../hooks/useBoolean";
import moment from "moment";
import HikDeviceContext from "./HikDeviceContext";
import { setSyncing, useSyncing } from "../../store/settings/autoPush";

const ExtraOverlay = (props: any) => {
  const {
    syncAttendances,
    syncPercent,
    device,
    deleteDevice,
  } = HikDeviceContext.use();
  useLanguage();

  const [isEditDeviceVisible, showEditDevice, hideEditDevice] = useBoolean();

  const onClickDeleteDevice = useCallback(() => {
    Modal.confirm({
      title: t("delete_device_confirmation"),
      onOk: deleteDevice,
      okText: `${t("OK")}`,
      cancelText: `${t("cancel")}`
    });
  }, [deleteDevice]);
  const syncing = useSyncing();

  const onClickSync = useCallback(() => {
    if (syncing === "1") {
      setSyncing("2"); // chuyen sang pause
      return;
    }
    setSyncing("1"); // chuyen sang dang sync
  }, [syncing]);

  return (
    <Menu {...props}>

      <Menu.Item onClick={showEditDevice}>
        <span>{t("edit_device")}</span>
      </Menu.Item>
      <AddDeviceModal
        onClose={hideEditDevice}
        visible={isEditDeviceVisible}
        device={device}
        mode={'hik_vision'}
      />
      <Menu.Item onClick={onClickSync}>
        <span>{syncing === "1" ? t('stop_syncing') : syncing === "2" ? t('start_syncing') : t("sync")}</span>
      </Menu.Item>

      <Menu.Item onClick={onClickDeleteDevice}>
        <span>{t("delete_device")}</span>
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



const SyncTag = () => {
  useLanguage();

  const { syncPercent, syncAttendances } = HikDeviceContext.use();

  if (!syncPercent) return null;

  return (
    <Tag onClick={syncAttendances}>
      {t("sync")}: {syncPercent}
    </Tag>
  );
};



const HikDevice = memo(function HikDevice({ device, syncTurn }: { device: Device, syncTurn: boolean }) {
  const syncing = useSyncing();
  useLanguage();

  return (
    <HikDeviceContext.Provider device={device} syncTurn={syncTurn}>
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
        {
          syncing === "1"
            ? <InfoRow>
              {t("auto_syncing")}
            </InfoRow>
            : null
        }
      </Wrapper>
    </HikDeviceContext.Provider>
  );
});

export default HikDevice;

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