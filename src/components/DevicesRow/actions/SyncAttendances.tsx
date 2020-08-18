import React, { memo, useCallback, useEffect } from "react";
import { useCurrentDevice } from "../context";
import { useAsyncFn } from "react-use";
import { Alert, Modal } from "antd";

const SyncAttendances = memo(function SyncAttendances() {
  const { connection } = useCurrentDevice();

  const [{ error }, onClick] = useAsyncFn(async () => {
    // console.log("start disable device");
    // await connection.disableDevice();
    console.log("start get attendance");
    const attendance = await connection.getAttendance();
    console.log("attendance", attendance);
    // console.log("start enable device");
    // await connection.enableDevice();
  }, [connection]);

  useEffect(() => {
    if (!error) return;
    connection.enableDevice();
    Modal.error({ title: error.message });
  }, [error]);

  return <a onClick={onClick}>Sync attendances</a>;
});

export default SyncAttendances;
