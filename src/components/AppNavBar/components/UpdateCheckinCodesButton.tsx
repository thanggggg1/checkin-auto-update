import React, { memo } from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons/lib";
import { useAsyncFn } from "react-use";
import Fetch from "../../../utils/Fetch";
import { useLanguage, t } from "../../../store/settings/languages";

const UpdateCheckinCodesButton = memo(function UpdateCheckinCodesButton() {
  useLanguage();

  const [{ loading }, onPress] = useAsyncFn(Fetch.requestCheckinCodes, []);
  return (
    <Button loading={loading} onClick={onPress}>
      <DownloadOutlined /> {t('update_checkin_codes')}
    </Button>
  );
});

export default UpdateCheckinCodesButton;
