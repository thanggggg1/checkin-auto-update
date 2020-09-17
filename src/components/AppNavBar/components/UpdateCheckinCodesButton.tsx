import React, { memo } from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons/lib";
import { useAsyncFn } from "react-use";
import Fetch from "../../../utils/Fetch";

const UpdateCheckinCodesButton = memo(function UpdateCheckinCodesButton() {
  const [{ loading }, onPress] = useAsyncFn(Fetch.requestCheckinCodes, []);
  return (
    <Button loading={loading} onClick={onPress}>
      <DownloadOutlined /> Update checkin codes
    </Button>
  );
});

export default UpdateCheckinCodesButton;
