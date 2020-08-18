import React, { memo } from "react";
import { Tag } from "antd";
import { SyncState, useCurrentDevice } from "../context";

const SyncTag = memo(function SyncTag() {
  const { syncState } = useCurrentDevice();

  if (syncState === SyncState.NOT_STARTED) return null;
  return (
    <Tag>
      Sync:{" "}
      {(() => {
        if (syncState === SyncState.PROCESSING) return "Processing";
        if (syncState === SyncState.GETTING_DATA) return "Getting data";
        return "";
      })()}
    </Tag>
  );
});

export default SyncTag;
