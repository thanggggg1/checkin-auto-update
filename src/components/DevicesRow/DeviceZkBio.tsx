import React, { memo } from "react";
import { Device } from "../../store/devices";
import { Card } from "antd";
import { styled } from "../../global";
import DeviceItemExtra from "./DeviceItemExtra";
import { DeviceProvider } from "./context";
import SyncTag from "./tags/SyncTag";
import { t, useLanguage } from "../../store/settings/languages";
import moment from "moment";
import { useSyncing } from "../../store/settings/autoPush";
import { getSettingZkBioSystem } from "../../store/settings/settingZkBioSystem";


const DeviceZkBioInfo = memo(function DeviceInfo({ syncTurn }: { syncTurn: boolean }) {
  useLanguage();
  const syncing = useSyncing();
  const _ZkBioSystem = getSettingZkBioSystem();

  const openHref = () => {
    const shell = require("electron").shell;
    shell.openExternal(_ZkBioSystem.domain);
  };

  return (
    <Wrapper title={_ZkBioSystem.name} size={"small"} extra={<DeviceItemExtra/>}>
      <InfoRow>
        Domain: <Href onClick={openHref}>{_ZkBioSystem.domain}</Href>
      </InfoRow>
      {
        syncTurn && syncing === "1"
          ? <InfoRow>
            {t("auto_syncing")}
          </InfoRow>
          : null
      }
      <InfoRow>
        {t("newest_eventLog")}:
        {
          _ZkBioSystem?.lastSync ? <div style={{
            fontWeight: "bold",
            paddingLeft: 8
          }}>{" "}{moment(_ZkBioSystem.lastSync).format("DD-MM-YYYY HH:mm")}</div> : null
        }
      </InfoRow>
      <InfoRow>
        {t("last_auto_sync")}:
        {
          _ZkBioSystem?.syncTime ? <div style={{
            fontWeight: "bold",
            paddingLeft: 8
          }}>{" "}{moment(_ZkBioSystem.syncTime).format("DD-MM-YYYY HH:mm")}</div> : null
        }
      </InfoRow>
      <InfoRow>{t("status")}: <div style={{
        fontWeight: "bold",
        paddingLeft: 8,
        color: _ZkBioSystem?.status == "Online" ? "#64ef64" : "red"
      }}>{_ZkBioSystem?.status}</div></InfoRow>
      <TagsWrapper>
        <SyncTag/>
      </TagsWrapper>
    </Wrapper>
  );
});

const DeviceZkBioItem = memo(function DeviceItem({ device, syncTurn }: { syncTurn: boolean, device: Device }) {
  return (
    <DeviceProvider device={device} syncTurn={syncTurn}>
      <DeviceZkBioInfo syncTurn={syncTurn}/>
    </DeviceProvider>
  );
});

export default DeviceZkBioItem;

const Wrapper = styled(Card)`
  flex: 0 0 350px;
`;

const InfoRow = styled.div`
  margin-bottom: 0;
  display: flex
`;

const TagsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Href = styled.div`
  color: #0077cc;
  padding-left: 8px;
  :hover {
    cursor: pointer;
  }
`;
