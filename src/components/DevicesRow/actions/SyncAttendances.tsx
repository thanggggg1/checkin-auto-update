import React, { memo, useEffect } from "react";
import { useCurrentDevice } from "../context";
import { useAsyncFn } from "react-use";
import { Modal } from "antd";
import {
  formatRawAttendanceRecords,
  syncAttendanceRecords,
} from "../../../store/records";

const SyncAttendances = memo(function SyncAttendances() {
  const { connection, device } = useCurrentDevice();

  const [{ error }, onClick] = useAsyncFn(async () => {
    // console.log("start disable device");
    // await connection.disableDevice();
    const attendance = await connection.getAttendance();
    syncAttendanceRecords(formatRawAttendanceRecords(attendance, device.ip));
    // console.log("start enable device");
    // await connection.enableDevice();
  }, [connection, device]);

  useEffect(() => {
    if (!error) return;
    connection.enableDevice();
    Modal.error({ title: error.message });
  }, [error]);

  return <a onClick={onClick}>Sync attendances</a>;
});

export default SyncAttendances;
