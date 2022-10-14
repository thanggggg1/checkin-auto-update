import React, { memo, SyntheticEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Table } from "antd";
import { AttendanceRecord, getAllRecordsArr } from "../store/records";
import { t, useLanguage } from "../store/settings/languages";
import moment, { Moment } from "moment";

const { RangePicker } = DatePicker;

const RecordsTable = memo(function RecordsTable() {

  const lang = useLanguage();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [params, setParams] = useState({
    dateRange: [moment().startOf("month"), moment().endOf("month")],
    searchCode: ''
  });

  const [tempData, setTempData] = useState({
    dateRange: [moment().startOf("month"), moment().endOf("month")],
    searchCode: ''
  });


  useEffect(() => {
    // run after 2s because store not mounted data
    const _records = getAllRecordsArr();
    setRecords(_records);
  }, []);

  useEffect(() => {
    const _interval = setInterval(() => {
      const _records = getAllRecordsArr();
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
  }, [params]);

  const { dataSource, uids, ips } = useMemo(() => {
    const uids: Record<string | number, string | number> = {};
    const ips: Record<string, string> = {};
    let results = [];
    const _start = params.dateRange[0].valueOf();
    const _end = params.dateRange[1].set({hour: 23, minute: 59}).valueOf();

    for (let i = 0; i < records.length; i++){
      const record = records[i];
      if (record.timestamp > _start && record.timestamp <= _end) {
        if (params.searchCode && record.uid.toString() !== params.searchCode) {
          continue
        }
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
  }, [records?.length, params]);

  const columns = useMemo(() => {
    return [
      {
        title: t("checkin_code"),
        key: "checkin-code",
        dataIndex: "uid",
        // filters: Object.values(uids ||{}).map((uid) => ({ text: uid, value: uid })),
        // onFilter: (value: string | number, record: any) => record.uid == value,
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

  const onDateChange = (vals:any) => {
    setTempData({
      ...tempData,
      dateRange: vals
    })
  };

  const onChange = useCallback((event: SyntheticEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    event.persist();
    if (name === 'searchCode') {
      setTempData({
        ...tempData,
        searchCode: value
      })
    }
  }, [tempData]);

  const onSearch = () => {
    setParams({...tempData})
  };

  const disabledDate = (current: Moment) => {
    const tooLate = tempData.dateRange[0] && current.diff(tempData.dateRange[0], 'months') > 3;
    const tooEarly = tempData.dateRange[1] && tempData.dateRange[1].diff(current, 'months') > 3;
    return !!tooEarly || !!tooLate;
  };

  return (
    <div>
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
        <Input
          name={"searchCode"}
          type={"text"}
          placeholder={"Mã chấm công"}
          onChange={onChange}
          value={tempData.searchCode}
          style={{
            padding: 8,
            borderRadius: 4,
            marginLeft: 12,
            width: 160
          }}
        />
        <RangePicker
          showTime={{ format: "DD/MM/YYYY" }}
          format="DD/MM/YYYY"
          value={tempData.dateRange}
          style={{
            padding: 8,
            borderRadius: 4,
            marginLeft: 12
          }}
          disabledDate={disabledDate}
          onOk={onDateChange}
        />
        <div
          className={'filterItem'}
          style={{
            width: 80,
            padding: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            marginLeft: 12,
            fontSize: 16,
            color: '#fff',
            backgroundColor: '#007AFF',
            textAlign: 'center',
            cursor: "pointer"
        }}
        onClick={onSearch}
        >
          Lọc
        </div>
      </div>
      <Table columns={columns} dataSource={dataSource} />
    </div>
  );
});

export default RecordsTable;
