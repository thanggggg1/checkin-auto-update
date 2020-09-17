import React, { memo } from "react";
import { Button, Modal, Input } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import useBoolean from "../../../hooks/useBoolean";

const SettingButton = memo(function SettingButton() {
  const [isVisible, show, hide] = useBoolean();

  return (
    <>
      <Button onClick={show}>
        <SettingOutlined /> Settings
      </Button>
      <Modal visible={isVisible} onCancel={hide} onOk={hide} title={"Settings"}>
        <Input
          addonBefore={"Auto sync time"}
          type={"number"}
          addonAfter={"minutes"}
          placeholder={"Ex: 15, 0 means disabled"}
          step={15}
          min={0}
          max={4320} // 72 hours, 3 days
        />
        <br />
        <br />
        <Input
          addonBefore={"Auto push time"}
          type={"number"}
          addonAfter={"minutes"}
          placeholder={"Ex: 15, 0 means disabled"}
          step={15}
          min={0}
          max={4320} // 72 hours, 3 days
        />
        <br />
        <br />
        <Input
          addonBefore={"Push logs from"}
          type={"number"}
          addonAfter={"minutes from now"}
          placeholder={"Ex: 30"}
          step={30}
          min={0}
          max={4320} // 72 hours, 3 days
        />
      </Modal>
    </>
  );
});

export default SettingButton;
