import React, { memo, SyntheticEvent, useCallback, useMemo } from "react";
import { Button, Modal, Input } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import useBoolean from "../../../hooks/useBoolean";
import {
  setAutoPushLogsMinutes,
  setPushLogsFromMinutes,
  useAutoPushLogsMinutes,
  useLastAutoPushLogsTime,
  usePushLogsFromMinutes,
} from "../../../store/settings/autoPush";
import {
  setAutoSyncLogsMinutes,
  useAutoSyncLogsMinutes,
  useLastAutoSyncLogsTime,
} from "../../../store/settings/autoSync";
import ClearRecordsButton from "./ClearRecordsButton";
import ClearPushedEvidentsButton from "./ClearPushedEvidentsButton";
import ButtonGroup from "antd/es/button/button-group";
import UpdateCheckinCodesButton from "./UpdateCheckinCodesButton";
import moment from "moment";

const SettingButton = memo(function SettingButton() {
  const [isVisible, show, hide] = useBoolean();

  const autoSyncLogsMinutes = useAutoSyncLogsMinutes();
  const autoPushLogsMinutes = useAutoPushLogsMinutes();
  const pushLogsFromMinutes = usePushLogsFromMinutes();

  const lastAutoSyncLogsTime = useLastAutoSyncLogsTime();
  const lastAutoSyncLogsMoment = useMemo(() => moment(lastAutoSyncLogsTime), [
    lastAutoSyncLogsTime,
  ]);
  const willAutoSyncAtMoment = useMemo(
    () => lastAutoSyncLogsMoment.clone().add(autoSyncLogsMinutes, "minutes"),
    [lastAutoSyncLogsMoment, autoSyncLogsMinutes]
  );

  const lastAutoPushLogsTime = useLastAutoPushLogsTime();
  const lastAutoPushLogsMoment = useMemo(() => moment(lastAutoPushLogsTime), [
    lastAutoPushLogsTime,
  ]);
  const willAutoPushAtMoment = useMemo(
    () => lastAutoPushLogsMoment.clone().add(autoPushLogsMinutes, "minutes"),
    [lastAutoPushLogsMoment, autoPushLogsMinutes]
  );

  const willPushLogsFromMoment = useMemo(
    () => willAutoPushAtMoment.clone().subtract(pushLogsFromMinutes, "minutes"),
    [willAutoPushAtMoment, pushLogsFromMinutes]
  );

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
      <Modal
        visible={isVisible}
        onCancel={hide}
        onOk={hide}
        title={"Settings"}
        width={560}
      >
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
        <span>
          Last auto sync: {lastAutoSyncLogsMoment.format("HH:mm:ss DD/MM/YYYY")}
        </span>
        <br />
        <span>
          The next auto sync is:{" "}
          {willAutoSyncAtMoment.format("HH:mm:ss DD/MM/YYYY")}
        </span>
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
        <span>
          Last auto push: {lastAutoPushLogsMoment.format("HH:mm:ss DD/MM/YYYY")}
        </span>
        <br />
        <span>
          The next auto push is:{" "}
          {willAutoPushAtMoment.format("HH:mm:ss DD/MM/YYYY")}
        </span>
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
        <span>
          Logs from {willPushLogsFromMoment.format("HH:mm:ss DD/MM/YYYY")} to
          now will be pushed in the next auto push
        </span>
        <br />
        <br />

        <ButtonGroup>
          <UpdateCheckinCodesButton />
          <ClearRecordsButton />
          <ClearPushedEvidentsButton />
        </ButtonGroup>
      </Modal>
    </>
  );
});

export default SettingButton;
