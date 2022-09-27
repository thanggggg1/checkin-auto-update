import React, { memo, useEffect, useMemo, useState } from "react";
import { DatePicker, Table } from "antd";
import { AttendanceRecord } from "../store/records";
import { t, useLanguage } from "../store/settings/languages";
import moment from "moment";
import { getStore } from "../store/storeAccess";
import  { Moment } from 'moment';

// const selector = (state: any): Record<string, AttendanceRecord> =>
//   state.records;

const { RangePicker } = DatePicker;
type RangeValue = [Moment | null, Moment | null] | null;

const RecordsTable = memo(function RecordsTable() {
  const lang = useLanguage();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(moment().subtract(30, "days"));
  const [nextTime, setNextTime] = useState(moment());
  const [dates, setDates] = useState<RangeValue>(null);


  // const records = useSelector(selector) || {};
  // const recordsThrottled = useThrottle(records, 3000);

  useEffect(() => {
    // run after 2s because store not mounted data
    const _data = getStore().getState().records;
    const _records: AttendanceRecord[] = Object.values(_data || {});
    setRecords(_records);
  }, []);

  useEffect(() => {
    const _interval = setInterval(() => {
      const _data = getStore().getState().records;
      const _records: AttendanceRecord[] = Object.values(_data || {});
      setRecords(oldRecords => {
      if(oldRecords.length !== _records.length){
        return _records;
      }
       else {
        return oldRecords
      }
      });
    }, 10 * 1000);
    return () => {
      _interval && clearInterval(_interval)
    }
  }, []);

  const { dataSource, uids, ips } = useMemo(() => {
    const uids: Record<string | number, string | number> = {};
    const ips: Record<string, string> = {};
    let results = [];

    for (let i = 0; i < records.length; i++){
      const record = records[i];
      if (record.timestamp > currentTime.valueOf()
        && record.timestamp <= nextTime.add(1,'days').valueOf()) {
        uids[record.uid] = record.uid;
        ips[record.deviceIp] = record.deviceIp;

        results.push({
          key: record.id,
          uid: record.uid,
          device: record.deviceIp,
          time: record.timeFormatted,
          date: record.dateFormatted,
          timestamp: record.timestamp,
        })
      }
    }
    return {
      uids,
      ips,
      dataSource: results,
    };
  }, [records?.length, currentTime.unix(), nextTime.unix()]);

  const columns = useMemo(() => {
    return [
      {
        title: t("checkin_code"),
        key: "checkin-code",
        dataIndex: "uid",
        filters: Object.values(uids ||{}).map((uid) => ({ text: uid, value: uid })),
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

  const disabledDate = (current: Moment) => {
    if (!dates) {
      return false;
    }
    const tooLate = dates[0] && current.diff(dates[0], 'months') > 6;
    const tooEarly = dates[1] && dates[1].diff(current, 'months') > 6;
    return !!tooEarly || !!tooLate;
  };

  console.log('data',dataSource);

  return <div>
    <div style={{
      marginTop: 16,
      marginBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 20,
      fontSize: 16
    }}>
      Dữ liệu trong khoảng:
      <RangePicker
        defaultValue={[currentTime, nextTime]}
        disabledDate={disabledDate}
        style={{
          padding: 8,
          borderRadius: 4,
          marginLeft: 12
        }}
        onChange={(values: any) => {
          console.log('values ', values);
          setCurrentTime(values[0])
          setNextTime(values[1])
        }}
        onCalendarChange={val => setDates(val)}

      />
    </div>
    <Table columns={columns} dataSource={dataSource} />
  </div>;
});

export default RecordsTable;
