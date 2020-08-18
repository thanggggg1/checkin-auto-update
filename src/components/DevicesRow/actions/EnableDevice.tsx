import React, {memo, useCallback} from "react";
import { useCurrentDevice } from "../context";

export const EnableDevice = memo(function EnableDevice() {
  const {connection} = useCurrentDevice();

  const onClick = useCallback(() => {
    connection.enableDevice();
  }, [connection]);

  return <a onClick={onClick}>Enable</a>
});

export default EnableDevice;