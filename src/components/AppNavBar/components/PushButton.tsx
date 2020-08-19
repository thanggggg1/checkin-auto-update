import React, { memo, useCallback, useState } from "react";
import { Button, Popover } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons/lib";
import { getStore } from "../../../store/storeAccess";
import { AttendanceRecord } from "../../../store/records";
import _ from "lodash";
import Fetch from "../../../utils/Fetch";

const PushButton = memo(function PushButton() {
  const [pushingPercent, setPushingPercent] = useState(0);

  const onClick = useCallback(() => {
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

    chunks.forEach((chunk) => {
      const mass = Fetch.massPush(chunk);
    });
  }, []);

  return (
    <Popover
      title={"Push"}
      content={"Push all attendance records to Base Checkin"}
    >
      <Button onClick={onClick}>
        <CloudUploadOutlined /> Push
      </Button>
    </Popover>
  );
});

export default PushButton;
