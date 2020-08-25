import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { clearAttendanceRecords } from "../../../store/records";

const ClearRecordsButton = memo(function ClearRecordsButton() {
  const onPress = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to clear all records",
      content: "You cannot undone this action",
      onOk: () => {
        clearAttendanceRecords();
      },
      okCancel: true,
    });
  }, []);
  return <Button onClick={onPress}>Clear all records</Button>;
});

export default ClearRecordsButton;
