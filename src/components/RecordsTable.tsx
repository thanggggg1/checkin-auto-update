import React, { memo, useMemo } from "react";
import { Table } from "antd";
import { AttendanceRecord } from "../store/records";
import { useSelector } from "react-redux";
import { useThrottle } from "react-use";
import { useLanguage, t } from "../store/settings/languages";

const selector = (state: any): Record<string, AttendanceRecord> =>
  state.records;

const RecordsTable = memo(function RecordsTable() {
  const lang = useLanguage();

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

  const columns = useMemo(
    () => [
      {
        title: t("checkin_code"),
        key: "checkin-code",
        dataIndex: "uid",
      },
      {
        title: t("device"),
        key: "device",
        dataIndex: "device",
      },
      {
        title: t("time"),
        key: "time",
        dataIndex: "time",
      },
      {
        title: t("date"),
        key: "date",
        dataIndex: "date",
      },
    ],
    [lang]
  );

  return <Table columns={columns} dataSource={dataSource} />;
});

export default RecordsTable;
