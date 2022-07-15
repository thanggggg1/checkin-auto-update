import React, { memo, useCallback } from "react";
import { Button, Popover } from "antd";
import { DownloadOutlined } from "@ant-design/icons/lib";
import { Events, events } from "../../../utils/events";
import { useLanguage, t } from "../../../store/settings/languages";
import { setSyncing, useSyncing } from "../../../store/settings/autoPush";

const SyncButton = memo(function SyncButton() {
  useLanguage();

  const onClick = useCallback(() => {
    events.emit(Events.MASS_SYNC);
  }, []);

  return (
    <Popover title={t("sync")} content={t("sync_desc")}>
      <Button onClick={onClick}>
        <DownloadOutlined /> {t("sync")}
      </Button>
    </Popover>
  );
});

export default SyncButton;
