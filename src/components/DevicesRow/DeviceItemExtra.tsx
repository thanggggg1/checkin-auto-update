import React, { memo } from "react";

import { Button, Dropdown } from "antd";
import DeviceActions from "./actions/DeviceActions";

const DeviceItemExtra = memo(function DeviceItemExtra() {
  return (
    <Dropdown overlay={<DeviceActions />} placement={"bottomLeft"} arrow>
      <Button>...</Button>
    </Dropdown>
  );
});

export default DeviceItemExtra;
