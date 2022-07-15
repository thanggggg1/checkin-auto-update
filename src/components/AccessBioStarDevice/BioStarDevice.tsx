import React, { memo, useCallback } from "react";
import { Device } from "../../store/devices";
import BioStarDeviceContext from "./BioStarDeviceContext";
import styled from "styled-components";
import { Button, Card, Dropdown, Menu, Modal, Tag } from "antd";
import { t, useLanguage } from "../../store/settings/languages";
import { setSyncing, useSyncing } from "../../store/settings/autoPush";
import moment from "moment";
import useBoolean from "../../hooks/useBoolean";
import AddDeviceModal from "../AddDeviceModal";
import { Events, events } from "../../utils/events";
import { TextStatusConnected, TextStatusDisconnected } from "../AccessDirectlyPyattDevice/PyattDevice";


const ExtraOverlay = (props: any) => {
  const {
    syncAttendances,
    deleteDevice,
    device,
  } = BioStarDeviceContext.use();
  const syncing = useSyncing();


  const [isEditDeviceVisible, showEditDevice, hideEditDevice] = useBoolean();

  const onClickDeleteDevice = useCallback(() => {
    Modal.confirm({
      title: t("delete_device_confirmation"),
      onOk: deleteDevice,
    });
  }, [deleteDevice]);

  return (
    <Menu {...props}>
      <Menu.Item
        onClick={syncAttendances}
      >
        <span>{t("sync_attendances")}</span>
      </Menu.Item>
      {/*<Menu.Item*/}
      {/*  disabled={connectionState !== ConnectionState.CONNECTED}*/}
      {/*  onClick={enableDevice}*/}
      {/*>*/}
      {/*  <span>{t("enable")}</span>*/}
      {/*</Menu.Item>*/}
      {/*<Menu.Item*/}
      {/*  disabled={connectionState !== ConnectionState.CONNECTED}*/}
      {/*  onClick={disableDevice}*/}
      {/*>*/}
      {/*  <span>{t("disable")}</span>*/}
      {/*</Menu.Item>*/}
      <Menu.Item onClick={showEditDevice}>
        <span>{t("edit")}</span>
      </Menu.Item>
      <AddDeviceModal
        onClose={hideEditDevice}
        visible={isEditDeviceVisible}
        device={device}
        mode={'bio_star'}
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


const SyncTag = () => {
  useLanguage();

  const { syncPercent, syncAttendances } = BioStarDeviceContext.use();

  if (!syncPercent) return null;

  return (
    <Tag onClick={syncAttendances}>
      {t("sync")}: {syncPercent}
    </Tag>
  );
};


const BioStarDevice = memo(function BioStarDevice({device,syncTurn }: {device:Device, syncTurn: boolean }) {
  useLanguage();
  const syncing = useSyncing();
  const openHref = () => {
    const shell = require("electron").shell;
    shell.openExternal(device.domain);
  };
  return (
    <BioStarDeviceContext.Provider device={device} syncTurn={syncTurn}>
      <Wrapper title={device.name} size={"small"} extra={<Extra/>}>
        <InfoRow>
          Domain: <Href onClick={openHref}>{device.domain}</Href>
        </InfoRow>
        {
          syncTurn && syncing === "1"
            ? <InfoRow>
              Đang đồng bộ
            </InfoRow>
            : null
        }
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
        <InfoRow>{t("status")}:
          {(() => {
            if (device?.status === "Online") return <TextStatusConnected>{t('online')}</TextStatusConnected>
            return <TextStatusDisconnected>{t("offline")}</TextStatusDisconnected>
          })()}</InfoRow>
        <TagsWrapper>
          <SyncTag/>
        </TagsWrapper>
      </Wrapper>
    </BioStarDeviceContext.Provider>
  );
});
export default BioStarDevice

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

const Href = styled.div`
  color: #0077cc;
  padding-left: 8px;
  :hover {
    cursor: pointer;
  }
`;