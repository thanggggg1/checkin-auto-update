import React, { memo, useState } from "react";
import { Button, Popover } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons/lib";
import { getStore } from "../../../store/storeAccess";
import { AttendanceRecord } from "../../../store/records";
import _ from "lodash";
import Fetch from "../../../utils/Fetch";
import { useAsyncFn } from "react-use";

const PushButton = memo(function PushButton() {
  const [pushingPercent, setPushingPercent] = useState(0);

  const [{ loading }, onClick] = useAsyncFn(async () => {
    const {
      records,
      pushedRecords,
    }: {
      records: Record<string, AttendanceRecord>;
      pushedRecords: string[];
    } = getStore().getState();

    const pushedSet = new Set(pushedRecords);

    const notPushedRecords = Object.values(records).filter(
      (record: AttendanceRecord) => !pushedSet.has(record.id)
    );

    const chunks = _.chunk(notPushedRecords, 100);

    setPushingPercent(0);
    let index = 0;
    for (const chunk of chunks) {
      await Fetch.massPush(chunk);
      setPushingPercent((100 * index + chunk.length) / notPushedRecords.length);
      index++;
    }
  }, []);

  return (
    <Popover
      title={"Push"}
      content={"Push all attendance records to Base Checkin"}
    >
      <Button disabled={loading} onClick={onClick}>
        {loading ? (
          `Pushing ${pushingPercent}%...`
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
