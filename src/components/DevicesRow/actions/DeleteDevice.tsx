import React, {memo, useCallback} from "react";
import {Menu, Modal} from "antd";
import {useCurrentDevice} from "../context";
import {deleteDevices} from "../../../store/devices";

const DeleteDevice = memo(function DeleteDevice(props) {
  const { device } = useCurrentDevice();

  const deleteDevice = useCallback(() => {
    deleteDevices([device.ip]);
  }, [device.ip]);

  const onClick = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to delete this device?",
      onOk: deleteDevice,
    });
  }, [deleteDevice]);

  return <a onClick={onClick}>Delete</a>
});

export default DeleteDevice;
