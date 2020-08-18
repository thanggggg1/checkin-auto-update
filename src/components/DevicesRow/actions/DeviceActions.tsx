import React, { memo } from "react";
import { Menu } from "antd";
import DeleteDevice from "./DeleteDevice";
import EnableDevice from "./EnableDevice";
import Reconnect from "./Reconnect";
import DisableDevice from "./DisableDevice";
import { SyncState, useCurrentDevice } from "../context";

const DeviceActions = memo(function DeviceActions(props) {
  const { syncAttendances, syncState } = useCurrentDevice();
  return (
    <Menu {...props}>
      <Menu.Item
        disabled={syncState !== SyncState.NOT_STARTED}
        onClick={syncAttendances}
      >
        <span>Sync attendances</span>
      </Menu.Item>
      <Menu.Item>
        <EnableDevice />
      </Menu.Item>
      <Menu.Item>
        <DisableDevice />
      </Menu.Item>
      <Menu.Item>
        <Reconnect />
      </Menu.Item>
      <Menu.Item>
        <DeleteDevice />
      </Menu.Item>
    </Menu>
  );
});

export default DeviceActions;
