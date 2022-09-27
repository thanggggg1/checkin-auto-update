import React, { memo, useCallback } from "react";
import { Device } from "../../store/devices";
import LegacyDeviceContext, { ConnectionState } from "./LegacyDeviceContext";
import { Button, Card, Dropdown, Menu, Modal, Tag } from "antd";
import styled from "styled-components";
import { t, useLanguage } from "../../store/settings/languages";
import useBoolean from "../../hooks/useBoolean";
import AddDeviceModal from "../AddDeviceModal";
import {
  TextStatusConnected,
  TextStatusConnecting,
  TextStatusDisconnected
} from "../AccessDirectlyPyattDevice/PyattDevice";
import moment from "moment";

const ExtraOverlay = (props: any) => {
  const {
    syncAttendances,
    connectionState,
    enableDevice,
    disableDevice,
    deleteDevice,
    device,
  } = LegacyDeviceContext.use();

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
      <Menu.Item
        disabled={connectionState !== ConnectionState.CONNECTED}
        onClick={syncAttendances}
      >
        <span>{t("sync_attendances")}</span>
      </Menu.Item>
      <Menu.Item
        disabled={connectionState !== ConnectionState.CONNECTED}
        onClick={enableDevice}
      >
        <span>{t("enable")}</span>
      </Menu.Item>
      <Menu.Item
        disabled={connectionState !== ConnectionState.CONNECTED}
        onClick={disableDevice}
      >
        <span>{t("disable")}</span>
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

  const { syncPercent} = LegacyDeviceContext.use();

  if (syncPercent === 0) return null;

  return (
    <Tag>{t('sync')}: {syncPercent}%</Tag>
  );
};

const LegacyDeviceInfo=memo(function LegacyDeviceInfo() {
  const {device,connectionState}=LegacyDeviceContext.use()
  return (
    <Wrapper title={device.name} size={"small"} extra={<Extra />}>
      <InfoRow>IP: {device.ip}</InfoRow>
      {/*<InfoRow>*/}
      {/*  {t("newest_eventLog")}:*/}
      {/*  {*/}
      {/*    device?.lastSync ? <div style={{*/}
      {/*      fontWeight: "bold",*/}
      {/*      paddingLeft: 8*/}
      {/*    }}>{" "}{moment(device.lastSync).format("DD-MM-YYYY HH:mm")}</div> : null*/}
      {/*  }*/}
      {/*</InfoRow>*/}
      <InfoRow>
        {t("status")}:{" "}
        {(() => {
          if (connectionState === ConnectionState.CONNECTED) return <TextStatusConnected>{t('connected')}</TextStatusConnected>
          if (connectionState === ConnectionState.CONNECTING)
            return <TextStatusConnecting>{t('connecting')}</TextStatusConnecting>
          if (connectionState === ConnectionState.DISCONNECTED)
            return <TextStatusDisconnected>{t('disconnected')}</TextStatusDisconnected>
          return t("unknown");
        })()}
      </InfoRow>
      <TagsWrapper>
        <SyncTag />
      </TagsWrapper>
    </Wrapper>
)
})

const LegacyDevice = memo(function LegacyDevice({ device, syncTurn }: { device: Device, syncTurn: boolean }) {
  return (
    <LegacyDeviceContext.Provider device={device} syncTurn={syncTurn}>
      <LegacyDeviceInfo/>
    </LegacyDeviceContext.Provider>
  );
});
export default LegacyDevice
const Wrapper = styled(Card)`
  flex: 0 0 350px;
   width: 420px;
  height: 180px;
`;

const InfoRow = styled.div`
   margin-bottom: 0;
  display: flex
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
