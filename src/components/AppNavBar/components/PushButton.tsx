import React, { memo } from "react";
import { Button, Popover } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons/lib";
import { filterRecords, getAllRecordsArr } from "../../../store/records";
import Fetch from "../../../utils/Fetch";
import { useAsyncFn } from "react-use";
import { usePushingPercent } from "../../../store/settings/pushingPercent";

const PushButton = memo(function PushButton() {
  const pushingPercent = usePushingPercent();

  const [{ loading }, onClick] = useAsyncFn(async () => {
    await Fetch.massPushSplitByChunks(
      filterRecords(getAllRecordsArr(), {
        onlyNotPushed: true,
      })
    );
  }, []);

  return (
    <Popover
      title={"Push"}
      content={"Push all attendance records to Base Checkin"}
    >
      <Button disabled={loading} onClick={onClick}>
        {loading ? (
          `Pushing ${Math.floor(pushingPercent * 10000) / 100}%...`
        ) : (
          <>
            <CloudUploadOutlined /> Push
          </>
        )}
      </Button>
    </Popover>
  );
});

export default PushButton;
