import React, { memo, useCallback } from "react";
import { useCurrentDevice } from "../context";

export const Reconnect = memo(function Reconnect() {
  const { connection } = useCurrentDevice();

  const onClick = useCallback(() => connection.connect(), [connection]);

  return <a onClick={onClick}>Reconnect</a>;
});

export default Reconnect;
