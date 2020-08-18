import React, { memo } from "react";
import { Menu } from "antd";
import DeleteDevice from "./DeleteDevice";
import SyncAttendances from "./SyncAttendances";
import EnableDevice from "./EnableDevice";
import Reconnect from "./Reconnect";

const DeviceActions = memo(function DeviceActions(props) {
  return (
    <Menu {...props}>
      <Menu.Item>
        <SyncAttendances />
      </Menu.Item>
      <Menu.Item>
        <EnableDevice />
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
