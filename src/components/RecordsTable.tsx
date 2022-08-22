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

  const { dataSource, uids, ips } = useMemo(() => {
    const uids: Record<string | number, string | number> = {};
    const ips: Record<string, string> = {};

    const dataSource = Object.values(records).map((record) => {
      uids[record.uid] = record.uid;
      ips[record.deviceName] = record.deviceName;
      return {
        key: record.id,
        uid: record.uid,
        device: record.deviceName,
        time: record.timeFormatted,
        date: record.dateFormatted,
        timestamp: record.timestamp,
      };
    });

    return {
      uids,
      ips,
      dataSource,
    };
  }, [recordsThrottled]);

  const columns = useMemo(() => {
    return [
      {
        title: t("checkin_code"),
        key: "checkin-code",
        dataIndex: "uid",
        filters: Object.values(uids || {}).map((uid) => ({ text: uid, value: uid })),
        onFilter: (value: string | number, record: any) => record.uid == value,
      },
      {
        title: t("device"),
        key: "device",
        dataIndex: "device",
        filters: Object.values(ips || {}).map((ip) => ({ text: ip, value: ip })),
        onFilter: (value: string | number, record: any) =>
          record.device == value,
      },
      {
        title: t("time"),
        key: "time",
        dataIndex: "time",
        defaultSortOrder: "descend",
      },
      {
        title: t("date"),
        key: "date",
        dataIndex: "date",
        defaultSortOrder: "descend",
        sorter: (a: AttendanceRecord, b: AttendanceRecord) =>
          a.timestamp - b.timestamp,
      },
    ];
  }, [lang, ips, uids]);

  // @ts-ignore
  return <Table columns={columns} dataSource={dataSource} />;
});

export default RecordsTable;
