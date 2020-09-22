import React, { memo, useCallback, useEffect, useState } from "react";
import { Button, DatePicker, Modal, Popover } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons/lib";
import { filterRecords, getAllRecordsArr } from "../../../store/records";
import Fetch from "../../../utils/Fetch";
import { useAsyncFn } from "react-use";
import { usePushingPercent } from "../../../store/settings/pushingPercent";
import useBoolean from "../../../hooks/useBoolean";
import moment from "moment";
import {
  useLanguage,
  t,
  antdModalLanguageProps,
} from "../../../store/settings/languages";

const PushButton = memo(function PushButton() {
  useLanguage();
  const pushingPercent = usePushingPercent();
  const [isPushModalVisible, _showPushModal, hidePushModal] = useBoolean();

  const [timeRange, setTimeRange] = useState(() => [
    moment().subtract(3, "days"),
    moment(),
  ]);

  const [{ loading }, onClick] = useAsyncFn(async () => {
    hidePushModal();
    await Fetch.massPushSplitByChunks(
      filterRecords(getAllRecordsArr(), {
        onlyNotPushed: true,
        onlyInEmployeeCheckinCodes: true,
        startTime: timeRange[0].clone().startOf("day").valueOf(),
        endTime: timeRange[1].clone().startOf("day").valueOf(),
      })
    );
  }, [timeRange]);

  const showPushModal = useCallback(() => {
    setTimeRange([moment().subtract(3, "days"), moment()]);
    _showPushModal();
  }, []);

  const onChange = useCallback((value: [moment.Moment, moment.Moment]) => {
    setTimeRange(value);
  }, []);

  const onOk = useCallback((value: [moment.Moment, moment.Moment]) => {
    setTimeRange(value);
  }, []);

  return (
    <>
      <Button disabled={loading} onClick={showPushModal}>
        {loading ? (
          `${t("pushing")} ${pushingPercent}%...`
        ) : (
          <>
            <CloudUploadOutlined /> {t("push")}
          </>
        )}
      </Button>

      <Modal
        title={t("push")}
        onOk={onClick}
        onCancel={hidePushModal}
        visible={isPushModalVisible}
        {...antdModalLanguageProps}
      >
        <p>
          <b>{t("push_modal_desc")}</b>
        </p>
        <DatePicker.RangePicker
          showTime={{ format: "DD/MM/YYYY" }}
          format="DD/MM/YYYY"
          onChange={onChange}
          onOk={onOk}
          placeholder={[t("start_time"), t("end_time")]}
          value={timeRange}
        />
      </Modal>
    </>
  );
});

export default PushButton;
