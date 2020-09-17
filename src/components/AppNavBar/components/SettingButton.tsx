import React, { memo, SyntheticEvent, useCallback } from "react";
import { Button, Modal, Input } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import useBoolean from "../../../hooks/useBoolean";
import {
  setAutoPushLogsMinutes,
  setPushLogsFromMinutes,
  useAutoPushLogsMinutes,
  usePushLogsFromMinutes,
} from "../../../store/settings/autoPush";
import {
  setAutoSyncLogsMinutes,
  useAutoSyncLogsMinutes,
} from "../../../store/settings/autoSync";

const SettingButton = memo(function SettingButton() {
  const [isVisible, show, hide] = useBoolean();

  const autoSyncLogsMinutes = useAutoSyncLogsMinutes();
  const autoPushLogsMinutes = useAutoPushLogsMinutes();
  const pushLogsFromMinutes = usePushLogsFromMinutes();

  const onChange = useCallback((event: SyntheticEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;

    if (name === "autoSyncMinutes") {
      if (Number(value) % 15 !== 0) return;
      return setAutoSyncLogsMinutes(Number(value));
    }

    if (name === "autoPushMinutes") {
      if (Number(value) % 15 !== 0) return;
      return setAutoPushLogsMinutes(Number(value));
    }

    if (name === "pushLogsFrom") {
      if (Number(value) % 30 !== 0) return;
      return setPushLogsFromMinutes(Number(value));
    }
  }, []);

  return (
    <>
      <Button onClick={show}>
        <SettingOutlined /> Settings
      </Button>
      <Modal visible={isVisible} onCancel={hide} onOk={hide} title={"Settings"}>
        <Input
          name={"autoSyncMinutes"}
          addonBefore={"Auto sync every"}
          type={"number"}
          addonAfter={"minutes"}
          placeholder={"Ex: 15, 0 means disabled"}
          step={15}
          min={0}
          max={4320} // 72 hours, 3 days
          onChange={onChange}
          value={autoSyncLogsMinutes}
        />
        <br />
        <br />
        <Input
          name={"autoPushMinutes"}
          addonBefore={"Auto push every"}
          type={"number"}
          addonAfter={"minutes"}
          placeholder={"Ex: 15, 0 means disabled"}
          step={15}
          min={0}
          max={4320} // 72 hours, 3 days
          onChange={onChange}
          value={autoPushLogsMinutes}
        />
        <br />
        <br />
        <Input
          name={"pushLogsFrom"}
          addonBefore={"Push logs from"}
          type={"number"}
          addonAfter={"minutes from now"}
          placeholder={"Ex: 30"}
          step={30}
          min={30}
          max={4320} // 72 hours, 3 days
          onChange={onChange}
          value={pushLogsFromMinutes}
        />
      </Modal>
    </>
  );
});

export default SettingButton;
