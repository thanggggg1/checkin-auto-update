import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { clearAttendanceRecords } from "../../../store/records";
import { DeleteOutlined } from "@ant-design/icons/lib";
import {
  antdModalLanguageProps,
  t,
  useLanguage,
} from "../../../store/settings/languages";

const ClearRecordsButton = memo(function ClearRecordsButton() {
  useLanguage();
  const onPress = useCallback(() => {
    Modal.confirm({
      title: t("clear_records_confirm_title"),
      content: t("clear_records_confirm_description"),
      onOk: () => {
        clearAttendanceRecords();
      },
      okCancel: true,
      ...antdModalLanguageProps,
    });
  }, []);
  return (
    <Button onClick={onPress} danger>
      <DeleteOutlined /> {t("clear_records")}
    </Button>
  );
});

export default ClearRecordsButton;
