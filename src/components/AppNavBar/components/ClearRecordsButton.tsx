import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { clearAttendanceRecords } from "../../../store/records";
import { DeleteOutlined } from "@ant-design/icons/lib";

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
  return (
    <Button onClick={onPress} danger>
      <DeleteOutlined /> Clear records
    </Button>
  );
});

export default ClearRecordsButton;
