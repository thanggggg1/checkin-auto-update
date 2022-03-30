import React, { memo, useCallback } from "react";
import { Button, Popover } from "antd";
import { DownloadOutlined } from "@ant-design/icons/lib";
import { Events, events } from "../../../utils/events";
import { useLanguage, t } from "../../../store/settings/languages";
import { setSyncing, useSyncing } from "../../../store/settings/autoPush";

const SyncButton = memo(function SyncButton() {
  useLanguage();
  const syncing = useSyncing();
  const onClick = useCallback(() => {
    if (syncing === "1") {
      setSyncing("2"); // chuyen sang pause
      return;
    }
    setSyncing("1"); // chuyen sang dang sync
    events.emit(Events.MASS_SYNC);
  }, [syncing]);

  return (
    <Popover title={t("sync")} content={t("sync_desc")}>
      <Button onClick={onClick}>
        <DownloadOutlined/> {syncing === "1" ? "Đang đồng bộ ..." : syncing === "2" ? "Tạm dừng" : t("sync")}
      </Button>
    </Popover>
  );
});

export default SyncButton;
