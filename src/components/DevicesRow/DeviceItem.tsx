import React, { memo } from "react";
import { Device } from "../../store/devices";
import { Card } from "antd";
import { styled } from "../../global";
import DeviceItemExtra from "./DeviceItemExtra";
import { ConnectionState, DeviceProvider, useCurrentDevice } from "./context";
import SyncTag from "./tags/SyncTag";
import { t, useLanguage } from "../../store/settings/languages";
import moment from "moment";
import { useSyncing } from "../../store/settings/autoPush";
import { getSettingDevice } from "../../store/settings/settingDevice";


const DeviceInfo = memo(function DeviceInfo({ syncTurn }: { syncTurn: boolean }) {
  useLanguage();
  const syncing = useSyncing();
  const _device=getSettingDevice();
  const {device}=useCurrentDevice();

  const openHref = () => {
    const shell = require("electron").shell;
    shell.openExternal(device.domain);
  };

  return (
    <Wrapper title={device.name} size={"small"} extra={<DeviceItemExtra/>}>
      <InfoRow>
        Domain: <Href onClick={openHref}>{device.domain}</Href>
      </InfoRow>
      {
        syncTurn && syncing === "1"
          ? <InfoRow>
            {t('auto_syncing')}
          </InfoRow>
          : null
      }
      <InfoRow>
        {t('newest_eventLog')}:
        {
          device?.lastSync ? <div style={{fontWeight: 'bold', paddingLeft: 8}}>{' '}{moment(device.lastSync).format("DD-MM-YYYY HH:mm")}</div> : null
        }
      </InfoRow>
      <InfoRow>
        {t('last_auto_sync')}:
        {
          _device?.syncTime ? <div style={{fontWeight: 'bold', paddingLeft: 8}}>{' '}{moment(_device.syncTime).format("DD-MM-YYYY HH:mm")}</div> : null
        }
      </InfoRow>
      <InfoRow>{t('status')}: <div style={{fontWeight:'bold',paddingLeft:8,color: _device?.status == 'Online' ? '#64ef64' : 'red'}}>{_device?.status}</div></InfoRow>
      <TagsWrapper>
        <SyncTag/>
      </TagsWrapper>
    </Wrapper>
  );
});

const DeviceItem = memo(function DeviceItem({ device, syncTurn }: { syncTurn: boolean, device: Device }) {
  return (
    <DeviceProvider device={device} syncTurn={syncTurn}>
      <DeviceInfo syncTurn={syncTurn}/>
    </DeviceProvider>
  );
});

export default DeviceItem;

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
