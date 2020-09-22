import React, { memo, useCallback } from "react";
import { Menu, Modal } from "antd";
import { ConnectionState, useCurrentDevice } from "../context";
import { t, useLanguage } from "../../../store/settings/languages";

const DeviceActions = memo(function DeviceActions(props) {
  useLanguage();

  const {
    syncAttendances,
    connectionState,
    enableDevice,
    disableDevice,
    reconnect,
    deleteDevice,
  } = useCurrentDevice();

  const onClickDeleteDevice = useCallback(() => {
    Modal.confirm({
      title: t("delete_device_confirmation"),
      onOk: deleteDevice,
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
      <Menu.Item
        disabled={connectionState !== ConnectionState.DISCONNECTED}
        onClick={reconnect}
      >
        <span>{t("reconnect")}</span>
      </Menu.Item>
      <Menu.Item onClick={onClickDeleteDevice}>
        <span>{t("delete")}</span>
      </Menu.Item>
    </Menu>
  );
});

export default DeviceActions;
