import React, { memo, useCallback } from "react";
import { Device } from "../../store/devices";
import styled from "styled-components";
import { Button, Card, Dropdown, Menu, Modal, Popover, Tag } from "antd";
import { t, useLanguage } from "../../store/settings/languages";
import { setSyncing, useSyncing } from "../../store/settings/autoPush";
import moment from "moment";
import ZkBioSecurityContext from "./ZkBioSecurityDeviceContext";
import { getSettingZkBioSystem } from "../../store/settings/settingZkBioSystem";
import useBoolean from "../../hooks/useBoolean";
import { useAsyncFn } from "react-use";
import { timeSleep } from "../../utils/sleep";
import AddDeviceModal from "../AddDeviceModal";
import { Events, events } from "../../utils/events";
import { DownloadOutlined } from "@ant-design/icons/lib";
import { TextStatusConnected, TextStatusDisconnected } from "../AccessDirectlyPyattDevice/PyattDevice";

const ExtraOverlay = (props: any) => {
  useLanguage();
  const syncing = useSyncing();


  const [isEditDeviceVisible, showEditDevice, hideEditDevice] = useBoolean();

  const {
    deleteDevice,
    device
  } = ZkBioSecurityContext.use();

  const [{ loading }, deleteDeviceConfirm] = useAsyncFn(async () => {
    deleteDevice();
    await timeSleep(1);
    return;
  }, [deleteDevice]);

  const onClickDeleteDevice = useCallback(() => {
    Modal.confirm({
      title: t("delete_device_confirmation"),
      content: t("clear_devices_confirm_description"),
      onOk: deleteDeviceConfirm,
      okText: `${t("OK")}`,
      cancelText: `${t("cancel")}`
    });
  }, [deleteDevice]);


  return (
    <Menu {...props}>

      <Menu.Item onClick={showEditDevice}>
        <span>{t("edit")}</span>
      </Menu.Item>
      <AddDeviceModal
        onClose={hideEditDevice}
        visible={isEditDeviceVisible}
        device={device}
        mode={'zk_teco'}
      />
      <Menu.Item onClick={onClickDeleteDevice}>
        <span>{t("delete")}</span>
      </Menu.Item>
    </Menu>
  );
};



const Extra = () => {
  return (
    <Dropdown overlay={<ExtraOverlay/>} placement={"bottomLeft"} arrow>
      <Button>...</Button>
    </Dropdown>
  );
};


const SyncTag = () => {
  useLanguage();

  const { syncPercent } = ZkBioSecurityContext.use();

  if (syncPercent === 0) return null;

  return (
    <Tag>{t("sync")}: {syncPercent}%</Tag>
  );
};
const ZkBioSecurityDevice = memo(function ZkBioSecurityDevice({ device, syncTurn }: { device: Device, syncTurn: boolean }) {
  useLanguage();
  const syncing = useSyncing();

  const openHref = () => {
    const shell = require("electron").shell;
    shell.openExternal(device.domain);
  };
  return (
    <ZkBioSecurityContext.Provider device={device} syncTurn={syncTurn}>
      <Wrapper title={device.name} size={"small"} extra={<Extra/>}>
        <InfoRow>
          Domain: <Href onClick={openHref}>{device.domain}</Href>
        </InfoRow>
        {
          syncTurn && syncing === "1"
            ? <InfoRow>
              {t("auto_syncing")}
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
    </ZkBioSecurityContext.Provider>
  );
});
export default ZkBioSecurityDevice;


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