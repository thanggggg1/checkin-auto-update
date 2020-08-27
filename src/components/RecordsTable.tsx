import React, { memo, useCallback, useMemo } from "react";
import { Button, Modal, Table } from "antd";
import { AttendanceRecord, clearAttendanceRecords } from "../store/records";
import { useSelector } from "react-redux";
import { useThrottle } from "react-use";
import { DeleteOutlined } from "@ant-design/icons";

const columns = [
  {
    title: "Checkin code",
    key: "checkin-code",
    dataIndex: "uid",
  },
  {
    title: "Device",
    key: "device",
    dataIndex: "device",
  },
  {
    title: "Time",
    key: "time",
    dataIndex: "time",
  },
  {
    title: "Date",
    key: "date",
    dataIndex: "date",
  },
];

const selector = (state: any): Record<string, AttendanceRecord> =>
  state.records;

const ClearRecordsButton = memo(function ClearRecordsButton() {
  const onPress = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to clear all records",
      content: "You cannot undone this action",
      onOk: () => {
        clearAttendanceRecords();
      },
      okCancel: true,
    });
  }, []);
  return (
    <Button onClick={onPress} danger>
      <DeleteOutlined /> Clear all records
    </Button>
  );
});

const RecordsTable = memo(function RecordsTable() {
  const records = useSelector(selector) || {};
  const recordsThrottled = useThrottle(records, 3000);

  const dataSource = useMemo(() => {
    return Object.values(records)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((record) => ({
        key: record.id,
        uid: record.uid,
        device: record.deviceIp,
        time: record.timeFormatted,
        date: record.dateFormatted,
      }));
  }, [recordsThrottled]);

  const footer = useCallback(() => {
    return <ClearRecordsButton />;
  }, []);

  return <Table columns={columns} dataSource={dataSource} footer={footer} />;
});

export default RecordsTable;
