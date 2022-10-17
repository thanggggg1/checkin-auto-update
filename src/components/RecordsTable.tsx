import React, { memo, SyntheticEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Table } from "antd";
import { AttendanceRecord, getAllRecordsArr } from "../store/records";
import { t, useLanguage } from "../store/settings/languages";
import moment, { Moment } from "moment";
import VirtualTable from "./VirtualTable";
import LoginButton from "./AppNavBar/components/LoginButton";

const { RangePicker } = DatePicker;

interface State {
  dateRange:moment.Moment[],
  searchCode:string
}

const RecordsTable = memo(function RecordsTable() {
  const lang = useLanguage();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [params, setParams] = useState<State>({
    dateRange: [moment().startOf("isoWeek"), moment().endOf("month")],
    searchCode: ''
  });

  const [tempData, setTempData] = useState({
    dateRange: [moment().startOf("isoWeek"), moment().endOf("month")],
    searchCode: ''
  });


  useEffect(() => {
    // run after 2s because store not mounted data
    getAllRecordsArr(params.dateRange[0].format('DD/MM/YYYY'), params.dateRange[1].format('DD/MM/YYYY')).then(_records => {
      setRecords(_records);
    });
  }, []);

  const onGetData = (dataFilter?:State) => {
    const _params = dataFilter || params
    getAllRecordsArr(_params.dateRange[0].format('DD/MM/YYYY'), _params.dateRange[1].format('DD/MM/YYYY')).then(_records => {
      setRecords(oldRecords => {
        if(oldRecords.length !== _records.length){
          if(_params.searchCode){
            return _records.filter(item=>item.uid.toString() === _params.searchCode)
          }
          return _records
        }
        else {
          if(_params.searchCode){
            return _records.filter(item=>item.uid.toString() === _params.searchCode)
          }
          return oldRecords
        }
      });
    });
    return
  };

  useEffect(() => {
    const _interval = setInterval(() => {
      onGetData()
    }, 10 * 1000);
    return () => {
      _interval && clearInterval(_interval)
    }
  }, [onGetData]);

  const { dataSource, uids, ips } = useMemo(() => {
    const uids: Record<string | number, string | number> = {};
    const ips: Record<string, string> = {};
    let results = [];

    for (let i = 0; i < records.length; i++){
      const record = records[i];
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
    const newParams = {...tempData};
    setParams(newParams);
    onGetData(newParams);
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

          <VirtualTable columns={columns} dataSource={dataSource}    />

    </div>
  );
});

export default RecordsTable;
