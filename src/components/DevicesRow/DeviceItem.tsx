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

const Wrapper = styled(Card)`
  flex: 0 0 250px;
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

const DeviceInfo = memo(function DeviceInfo({ syncTurn }: { syncTurn: boolean }) {
  useLanguage();
  const syncing = useSyncing();
  const { device } = useCurrentDevice();

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
            Đang đồng bộ
          </InfoRow>
          : null
      }
      <InfoRow>
        {
          device?.lastSync ? "Đồng bộ lúc: "  : ""
        }
        {
          device?.lastSync ? <div style={{fontWeight: 'bold', paddingLeft: 8}}>{' '}{moment(device.lastSync).format("DD-MM-YYYY HH:mm")}</div> : null
        }
      </InfoRow>
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
