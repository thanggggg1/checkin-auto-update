import React, { memo } from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons/lib";
import { useAsyncFn } from "react-use";
import Fetch from "../../../utils/Fetch";
import { useLanguage, t } from "../../../store/settings/languages";
import { useDevicesRecord } from "../../../store/devices";

const UpdateCheckinCodesButton = memo(function UpdateCheckinCodesButton() {
  useLanguage();
  const devices = useDevicesRecord();

  const [{ loading }, onPress] = useAsyncFn(async () => {
    const _devices = Object.values(devices);
    for (let i = 0; i < _devices.length; i++) {
      const device = _devices[i];
      const res = await Fetch.requestCheckinCodes(device.ip, {
        token: device.clientToken,
        password: device.clientPassword
      })
    }

  }, []);
  return (
    <Button loading={loading} onClick={onPress}>
      <DownloadOutlined /> {t('update_checkin_codes')}
    </Button>
  );
});

export default UpdateCheckinCodesButton;
