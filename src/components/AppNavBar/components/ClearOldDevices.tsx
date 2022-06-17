import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { clearAttendanceRecords } from "../../../store/records";
import { DeleteOutlined } from "@ant-design/icons/lib";
import {
  antdModalLanguageProps,
  t,
  useLanguage,
} from "../../../store/settings/languages";
import {resetDevices} from '../../../store/devices'
const ClearOldDevices = memo(function ClearRecordsButton() {
  useLanguage();
  const onPress = useCallback(() => {
    Modal.confirm({
      title: t("clear_old_devices_confirm_title"),
      content: t("clear_old_devices_confirm_description"),
      onOk: () => {
        resetDevices();
      },
      okCancel: true,
      ...antdModalLanguageProps,
    });
  }, []);
  return (
    <Button onClick={onPress} danger>
      <DeleteOutlined /> {t("clear_devices")}
    </Button>
  );
});

export default ClearOldDevices;
