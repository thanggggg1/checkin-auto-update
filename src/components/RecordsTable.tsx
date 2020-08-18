import React, { memo, useMemo } from "react";
import { Table } from "antd";
import { AttendanceRecord } from "../store/records";
import { useSelector } from "react-redux";

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

const RecordsTable = memo(function RecordsTable() {
  const records = useSelector(selector) || {};

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
  }, []);

  return <Table columns={columns} dataSource={dataSource} />;
});

export default RecordsTable;
