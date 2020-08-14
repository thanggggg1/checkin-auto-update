import React, { memo } from "react";
import { Menu } from "antd";
import DeleteDevice from "./DeleteDevice";

const DeviceActions = memo(function DeviceActions(props) {
  return (
    <Menu {...props}>
      <Menu.Item>
        <DeleteDevice />
      </Menu.Item>
    </Menu>
  );
});

export default DeviceActions;
