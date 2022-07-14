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
  const onClickSync = useCallback(() => {
    if (syncing === "1") {
      setSyncing("2"); // chuyen sang pause
      return;
    }
    setSyncing("1"); // chuyen sang dang sync
    events.emit(Events.MASS_SYNC);
  }, [syncing]);

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
      <Menu.Item onClick={onClickSync}>
        <span>{syncing === "1" ? t('stop_syncing') : syncing === "2" ? t('start_syncing') : t("sync")}</span>
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
          {
            device?.lastSync ? "Đồng bộ lúc: "  : ""
          }
          {
            device?.lastSync ? <div style={{fontWeight: 'bold', paddingLeft: 8}}>{' '}{moment(device.lastSync).format("DD-MM-YYYY HH:mm")}</div> : null
          }
        </InfoRow>
        <InfoRow>{t("status")}: <div style={{
          fontWeight: "bold",
          paddingLeft: 8,
          color: device?.status == "Online" ? "#64ef64" : "red"
        }}>{device?.status}</div></InfoRow>
        <TagsWrapper>
          <SyncTag/>
        </TagsWrapper>
      </Wrapper>
    </BioStarDeviceContext.Provider>
  );
});
export default BioStarDevice

const Wrapper = styled(Card)`
  flex: 0 0 250px;
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