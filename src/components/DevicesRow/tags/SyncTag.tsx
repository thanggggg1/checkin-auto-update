import React, { memo } from "react";
import { Tag } from "antd";
import { useCurrentDevice } from "../context";

const SyncTag = memo(function SyncTag() {
  const { syncPercent } = useCurrentDevice();

  if (syncPercent === 0) return null;

  return <Tag>Sync: ${syncPercent}%</Tag>;
});

export default SyncTag;
