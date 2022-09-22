import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { clearAttendanceRecords } from "../../../store/records";
import { DeleteOutlined } from "@ant-design/icons/lib";
import { t, useLanguage } from "../../../store/settings/languages";
import { useAsyncFn } from "react-use";
import { timeSleep } from "../../../utils/sleep";

const ClearRecordsButton = memo(function ClearRecordsButton() {
  useLanguage();
  const [{ loading }, clearAttendanceRecordsConfirm] = useAsyncFn(async () => {
    clearAttendanceRecords();
    await timeSleep(5);
    return;
  }, []);

  const onPress = useCallback(() => {
    Modal.confirm({
      title: t("clear_records_confirm_title"),
      content: t("clear_records_confirm_description"),
      onOk: clearAttendanceRecordsConfirm,
      okCancel: true,
      okText: `${t("OK")}`,
      cancelText: `${t("cancel")}`
    });
  }, []);
  return (
    <Button onClick={onPress} danger>
      <DeleteOutlined/> {t("clear_records")}
    </Button>
  );
});

export default ClearRecordsButton;
