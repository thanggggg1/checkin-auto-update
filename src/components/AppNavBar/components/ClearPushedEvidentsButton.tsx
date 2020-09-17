import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons/lib";
import { resetPushedRecords } from "../../../store/pushedRecords";

const ClearPushedEvidentsButton = memo(function ClearPushedEvidentsButton() {
  const onPress = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to clear all pushed evidents",
      content: "The next time you push may be slower than normal",
      onOk: () => {
        resetPushedRecords();
      },
      okCancel: true,
    });
  }, []);
  return (
    <Button onClick={onPress} danger>
      <DeleteOutlined /> Clear pushed evidents
    </Button>
  );
});

export default ClearPushedEvidentsButton;
