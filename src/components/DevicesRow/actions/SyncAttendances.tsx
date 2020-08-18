import React, { memo } from "react";
import { useCurrentDevice } from "../context";

const SyncAttendances = memo(function SyncAttendances() {
  const { syncAttendances } = useCurrentDevice();

  return <a onClick={syncAttendances}>Sync attendances</a>;
});

export default SyncAttendances;
