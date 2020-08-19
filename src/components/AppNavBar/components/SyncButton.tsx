import React, { memo, useCallback } from "react";
import { Button, Popover } from "antd";
import { DownloadOutlined } from "@ant-design/icons/lib";
import { Events, events } from "../../../utils/events";

const SyncButton = memo(function SyncButton() {
  const onClick = useCallback(() => {
    events.emit(Events.MASS_SYNC);
  }, []);

  return (
    <Popover
      title={"Sync"}
      content={"Download attendances from attendance device"}
    >
      <Button onClick={onClick}>
        <DownloadOutlined /> Sync
      </Button>
    </Popover>
  );
});

export default SyncButton;
