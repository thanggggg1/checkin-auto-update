import React, { memo } from "react";
import { Tag } from "antd";
import { useCurrentDevice } from "../context";
import { t, useLanguage } from "../../../store/settings/languages";

const SyncTag = memo(function SyncTag() {
  useLanguage();

  const { syncPercent } = useCurrentDevice();

  if (syncPercent === 0) return null;

  return <Tag>{t('sync')}: ${syncPercent}%</Tag>;
});

export default SyncTag;
