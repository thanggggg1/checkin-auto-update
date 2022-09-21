import React, { memo, useCallback } from "react";
import { styled } from "../../global";
import { Card, Tag, Dropdown, Button, Menu, Modal } from "antd";
import { Device } from "../../store/devices";
import { t, useLanguage } from "../../store/settings/languages";
import AddDeviceModal from "../AddDeviceModal";
import useBoolean from "../../hooks/useBoolean";
import moment from "moment";
import HikDeviceContext from "./HikDeviceContext";

const ExtraOverlay = (props: any) => {
  const {
    syncAttendances,
    syncPercent,
    device,
    deleteDevice,
  } = HikDeviceContext.use();

  const [isEditDeviceVisible, showEditDevice, hideEditDevice] = useBoolean();

  const onClickDeleteDevice = useCallback(() => {
    Modal.confirm({
      title: t("delete_device_confirmation"),
      onOk: deleteDevice,
      okText: `${t("OK")}`,
      cancelText: `${t("cancel")}`
    });
  }, [deleteDevice]);

  return (
    <Menu {...props}>
      <Menu.Item >
        <span>{t("reconnect")}</span>
      </Menu.Item>
      <Menu.Item

        onClick={syncAttendances}
      >
        <span>{t("sync_attendances")}</span>
      </Menu.Item>

      <Menu.Item onClick={showEditDevice}>
        <span>{t("edit_device")}</span>
      </Menu.Item>
      <AddDeviceModal
        onClose={hideEditDevice}
        visible={isEditDeviceVisible}
        device={device}
        mode={'multi_mcc'}
      />

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
        <TagsWrapper>
          <SyncTag />
        </TagsWrapper>
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