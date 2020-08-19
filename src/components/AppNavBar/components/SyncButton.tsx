import React, { memo } from "react";
import { Button, Popover } from "antd";

const SyncButton = memo(function SyncButton() {
  return (
    <Popover
      title={"Sync"}
      content={"Download attendances from attendance device"}
    >
      <Button>Sync</Button>
    </Popover>
  );
});

export default SyncButton;
