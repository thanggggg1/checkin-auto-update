import React, { memo, useCallback } from "react";
import { Menu, Modal } from "antd";
import { ConnectionState, useCurrentDevice } from "../context";
import { t, useLanguage } from "../../../store/settings/languages";
import AddDeviceModal from "../../AddDeviceModal";
import useBoolean from "../../../hooks/useBoolean";

const DeviceActions = memo(function DeviceActions(props) {
  useLanguage();

  const [isEditDeviceVisible, showEditDevice, hideEditDevice] = useBoolean();

  const {
    syncAttendances,
    connectionState,
    enableDevice,
    disableDevice,
    deleteDevice,
    device,
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
      <Menu.Item onClick={showEditDevice}>
        <span>Edit</span>
        <AddDeviceModal
          onClose={hideEditDevice}
          visible={isEditDeviceVisible}
          device={device}
        />
      </Menu.Item>
      <Menu.Item onClick={onClickDeleteDevice}>
        <span>{t("delete")}</span>
      </Menu.Item>
    </Menu>
  );
});

export default DeviceActions;
