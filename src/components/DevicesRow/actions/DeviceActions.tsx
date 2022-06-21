import React, { memo, useCallback, useState } from "react";
import { Menu, Modal } from "antd";
import { useCurrentDevice } from "../context";
import { antdModalLanguageProps, t, useLanguage } from "../../../store/settings/languages";
import AddDeviceModal from "../../AddDeviceModal";
import useBoolean from "../../../hooks/useBoolean";
import { useAsyncFn } from "react-use";
import { timeSleep } from "../../../utils/sleep";

const DeviceActions = memo(function DeviceActions(props) {
  useLanguage();

  const [isEditDeviceVisible, showEditDevice, hideEditDevice] = useBoolean();

  const {
    syncAttendances,
    deleteDevice,
    device
  } = useCurrentDevice();



  const [{ loading }, deleteDeviceConfirm] = useAsyncFn( async () => {
     deleteDevice();
     await timeSleep(2)
    return;
  }, [deleteDevice]);

  const onClickDeleteDevice = useCallback(() => {
    Modal.confirm({
      title: t("delete_device_confirmation"),
      onOk: deleteDeviceConfirm,
      okText:`${t('OK')}`,
      cancelText:`${t('cancel')}`
    });
  }, [deleteDevice]);

  return (
    <Menu {...props}>

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
      />
      <Menu.Item onClick={onClickDeleteDevice}>
        <span>{t("delete")}</span>
      </Menu.Item>
    </Menu>
  );
});

export default DeviceActions;
