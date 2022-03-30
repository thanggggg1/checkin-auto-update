import React, { memo, SyntheticEvent, useCallback, useMemo } from "react";
import { Button, Modal, Input, Radio } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import useBoolean from "../../../hooks/useBoolean";
import {
  setAutoPushLogsMinutes,
  setPreventSyncLogsTimeRanges,
  useAutoPushLogsMinutes,
  useLastAutoPushLogsTime,
  usePreventSyncLogsTimeRanges
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
import {
  antdModalLanguageProps,
  setLanguage,
  t,
  useLanguage,
} from "../../../store/settings/languages";
import { RadioChangeEvent } from "antd/lib/radio/interface";

const SettingButton = memo(function SettingButton() {
  const [isVisible, show, hide] = useBoolean();
  const language = useLanguage();

  const autoSyncLogsMinutes = useAutoSyncLogsMinutes();
  const autoPushLogsMinutes = useAutoPushLogsMinutes();
  const preventSyncLogsTimeRanges = usePreventSyncLogsTimeRanges();

  const lastAutoSyncLogsTime = useLastAutoSyncLogsTime();
  const lastAutoSyncLogsMoment = useMemo(() => moment(lastAutoSyncLogsTime ? lastAutoPushLogsTime : undefined), [
    lastAutoSyncLogsTime,
  ]);
  const willAutoSyncAtMoment = useMemo(
    () => lastAutoSyncLogsMoment.clone().add(autoSyncLogsMinutes, "minutes"),
    [lastAutoSyncLogsMoment, autoSyncLogsMinutes]
  );

  const lastAutoPushLogsTime = useLastAutoPushLogsTime();
  const lastAutoPushLogsMoment = useMemo(() => moment(lastAutoPushLogsTime ? lastAutoPushLogsTime : undefined), [
    lastAutoPushLogsTime,
  ]);
  const willAutoPushAtMoment = useMemo(
    () => lastAutoPushLogsMoment.clone().add(autoPushLogsMinutes, "minutes"),
    [lastAutoPushLogsMoment, autoPushLogsMinutes]
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

    if (name === 'preventSyncLogsTimeRanges') {
      return setPreventSyncLogsTimeRanges(value);
    }
  }, []);

  const onLanguageChange = useCallback((event: RadioChangeEvent) => {
    setLanguage(event.target.value);
  }, []);

  return (
    <>
      <Button onClick={show}>
        <SettingOutlined /> {t("settings")}
      </Button>
      <Modal
        visible={isVisible}
        onCancel={hide}
        onOk={hide}
        title={t("settings")}
        width={560}
        {...antdModalLanguageProps}
      >
        {/*<Input*/}
        {/*  name={"autoSyncMinutes"}*/}
        {/*  addonBefore={t("auto_sync_every")}*/}
        {/*  type={"number"}*/}
        {/*  addonAfter={t("minutes")}*/}
        {/*  placeholder={"Ex: 15, 0 means disabled"}*/}
        {/*  step={15}*/}
        {/*  min={0}*/}
        {/*  max={4320} // 72 hours, 3 days*/}
        {/*  onChange={onChange}*/}
        {/*  value={autoSyncLogsMinutes}*/}
        {/*/>*/}
        {/*<br />*/}
        {/*{lastAutoSyncLogsTime ? <><span>*/}
        {/*  {t("last_auto_sync")}:{" "}*/}
        {/*  {lastAutoSyncLogsMoment.format("HH:mm:ss DD/MM/YYYY")}*/}
        {/*</span><br /></> : null}*/}
        {/*{autoSyncLogsMinutes ? <><span>*/}
        {/*  {t("the_next_auto_sync_is")}:{" "}*/}
        {/*  {willAutoSyncAtMoment.format("HH:mm:ss DD/MM/YYYY")}*/}
        {/*</span><br /></> : null}*/}
        {/*<br />*/}
        {/*<Input*/}
        {/*  name={"autoPushMinutes"}*/}
        {/*  addonBefore={t("auto_push_every")}*/}
        {/*  type={"number"}*/}
        {/*  addonAfter={t("minutes")}*/}
        {/*  placeholder={"Ex: 15, 0 means disabled"}*/}
        {/*  step={15}*/}
        {/*  min={0}*/}
        {/*  max={4320} // 72 hours, 3 days*/}
        {/*  onChange={onChange}*/}
        {/*  value={autoPushLogsMinutes}*/}
        {/*/>*/}
        {/*<br />*/}
        {/*{lastAutoPushLogsTime ? <><span>*/}
        {/*  {t("last_auto_push")}:{" "}*/}
        {/*  {lastAutoPushLogsMoment.format("HH:mm:ss DD/MM/YYYY")}*/}
        {/*</span><br /></> : null}*/}
        {/*{autoPushLogsMinutes ? <>*/}
        {/*<span>*/}
        {/*  {t("the_next_auto_push_is")}:{" "}*/}
        {/*  {willAutoPushAtMoment.format("HH:mm:ss DD/MM/YYYY")}*/}
        {/*</span><br />*/}
        {/*</> : null}*/}
        {/*<br />*/}

        {/*<Input*/}
        {/*  name={"preventSyncLogsTimeRanges"}*/}
        {/*  addonBefore={t("__", {*/}
        {/*    vi: 'Giờ tránh tự động đồng bộ',*/}
        {/*    en: 'Prevent sync logs time ranges'*/}
        {/*  })}*/}
        {/*  type={"text"}*/}
        {/*  placeholder={"Ex: 8:20-9:40, 17:25-17:35"}*/}
        {/*  step={30}*/}
        {/*  min={30}*/}
        {/*  max={4320} // 72 hours, 3 days*/}
        {/*  onChange={onChange}*/}
        {/*  value={preventSyncLogsTimeRanges}*/}
        {/*/>*/}
        {/*<span>*/}
        {/*  {t("__", {*/}
        {/*    vi: 'Định dạng: "HH:mm-HH:mm, HH:mm-HH:mm", ví dụ: 8:20-9:40, 17:25-17:35',*/}
        {/*    en: 'Format: "HH:mm-HH:mm, HH:mm-HH:mm", example: 8:20-9:40, 17:25-17:35'*/}
        {/*  })}*/}
        {/*</span>*/}
        {/*<br />*/}
        {/*<br />*/}

        <Radio.Group value={language} onChange={onLanguageChange}>
          <Radio.Button value="en">English</Radio.Button>
          <Radio.Button value="vi">Tiếng Việt</Radio.Button>
        </Radio.Group>

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
