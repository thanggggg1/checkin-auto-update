import React, { memo, useCallback, useEffect } from "react";
import { styled } from "../../global";
import { Button, Row } from "antd";
import LoginButton from "./components/LoginButton";
import Fetch from "../../utils/Fetch";
import LogoutButton from "./components/LogoutButton";
import PushButton from "./components/PushButton";
import ButtonGroup from "antd/lib/button/button-group";
import SyncButton from "./components/SyncButton";
import SettingButton from "./components/SettingButton";
import { requestEventLog, requestLoginDevice } from "../../store/devices/functions";
import moment from "moment";
import { FormatDateSearch } from "../../store/devices/types";
import { Device } from "../../store/devices";
import { getDeviceById } from "../../store/devices/actions";
import { getPwdChangeParams } from "../../utils/portalCheck";
import { hex_md5 } from "../../utils/hex_md5";

const Wrapper = styled(Row)`
  padding: 0 16px;
  height: 56px;
`;

const AppNameWrapper = styled(Row)`
  align-items: baseline;
`;

const AppName = styled.h1`
  font-size: 20px;
  margin: 0 8px 0 0;
`;

const AppNavBar = memo(function AppNavBar() {
  const token = Fetch.useToken();
  const device=getDeviceById('http://10.20.1.201:8098')
  const getTransactions=useCallback(async ()=>{
    let data=await requestLoginDevice({
      domain:device.domain,
      username:device.username,
      password:device.password
    })
    console.log('dataget',data.header._store['set-cookie']);
  },[])


  return (
    <Wrapper align={"middle"} justify={"space-between"}>
      <AppNameWrapper>
        <AppName>Base Checkin Client - ZkTeco</AppName>
        <span>v{require("electron").remote.app.getVersion()}</span>
      </AppNameWrapper>

      <Row>
        <ButtonGroup>
          <Button onClick={getTransactions}>Test get transactions</Button>
          <SettingButton />
          <SyncButton />
          <PushButton />
          {/*{token.token ? (*/}
          {/*  <>*/}
          {/*    <PushButton />*/}
          {/*    <LogoutButton />*/}
          {/*  </>*/}
          {/*) : (*/}
          {/*  <LoginButton />*/}
          {/*)}*/}
        </ButtonGroup>
      </Row>
    </Wrapper>
  );
});

export default AppNavBar;
