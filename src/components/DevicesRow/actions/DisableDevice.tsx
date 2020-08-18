import React, { memo, useCallback } from "react";
import { Modal } from "antd";
import { useCurrentDevice } from "../context";

const DisableDevice = memo(function DisableDevice() {
  const { connection } = useCurrentDevice();

  const disableDevice = useCallback(() => {
    connection.disableDevice();
  }, [connection]);

  const onClick = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to disable this device?",
      onOk: disableDevice,
    });
  }, [disableDevice]);

  return <a onClick={onClick}>Disable</a>;
});

export default DisableDevice;
