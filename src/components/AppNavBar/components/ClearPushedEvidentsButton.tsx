import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons/lib";
import { resetPushedRecords } from "../../../store/pushedRecords";
import {
  antdModalLanguageProps,
  t,
  useLanguage,
} from "../../../store/settings/languages";

const ClearPushedEvidentsButton = memo(function ClearPushedEvidentsButton() {
  useLanguage();

  const onPress = useCallback(() => {
    Modal.confirm({
      title: t("clear_pushed_evidents_confirm_title"),
      content: t("clear_pushed_evidents_confirm_desc"),
      onOk: () => {
        resetPushedRecords();
      },
      okCancel: true,
      ...antdModalLanguageProps,
    });
  }, []);
  return (
    <Button onClick={onPress} danger>
      <DeleteOutlined /> {t("clear_pushed_evidents")}
    </Button>
  );
});

export default ClearPushedEvidentsButton;
