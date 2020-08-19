import React, { memo, useCallback } from "react";
import { Menu, Modal } from "antd";
import { ConnectionState, SyncState, useCurrentDevice } from "../context";

const DeviceActions = memo(function DeviceActions(props) {
  const {
    syncAttendances,
    syncState,
    state,
    enableDevice,
    disableDevice,
    reconnect,
    deleteDevice,
  } = useCurrentDevice();

  const onClickDeleteDevice = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to delete this device?",
      onOk: deleteDevice,
    });
  }, [deleteDevice]);

  return (
    <Menu {...props}>
      <Menu.Item
        disabled={
          syncState !== SyncState.NOT_STARTED ||
          state !== ConnectionState.CONNECTED
        }
        onClick={syncAttendances}
      >
        <span>Sync attendances</span>
      </Menu.Item>
      <Menu.Item
        disabled={state !== ConnectionState.CONNECTED}
        onClick={enableDevice}
      >
        <span>Enable</span>
      </Menu.Item>
      <Menu.Item
        disabled={state !== ConnectionState.CONNECTED}
        onClick={disableDevice}
      >
        <span>Disable</span>
      </Menu.Item>
      <Menu.Item
        disabled={state !== ConnectionState.CLOSED}
        onClick={reconnect}
      >
        <span>Reconnect</span>
      </Menu.Item>
      <Menu.Item onClick={onClickDeleteDevice}>
        <span>Delete</span>
      </Menu.Item>
    </Menu>
  );
});

export default DeviceActions;
