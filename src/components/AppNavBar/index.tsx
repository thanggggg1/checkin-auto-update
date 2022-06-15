import React, { memo, useCallback } from "react";
import { styled } from "../../global";
import { Button, Row } from "antd";
import Fetch from "../../utils/Fetch";
import PushButton from "./components/PushButton";
import ButtonGroup from "antd/lib/button/button-group";
import SyncButton from "./components/SyncButton";
import SettingButton from "./components/SettingButton";
import { requestEventLog } from "../../store/devices/functions";
import {  useSettingDevice } from "../../store/settings/currentDevice";


const AppNavBar = memo(function AppNavBar() {
  const token = Fetch.useToken();
  // @ts-ignore
  const device = useSettingDevice();
  // const getTransactions = useCallback(async () => {
  //   const _device=getCurrentDevice();
  //   const data = await requestEventLog({
  //     domain: _device.domain,
  //     token: _device.token
  //   });
  //   const rows=JSON.parse(data).rows;
  //   // rows.map((transaction:any,index:number)=>{
  //   //
  //   // });
  // }, [device]);


  return (
    <Wrapper align={"middle"} justify={"space-between"}>
      <AppNameWrapper>
        <AppName>Base Checkin Client - ZkTeco</AppName>
        <span>v{require("electron").remote.app.getVersion()}</span>
      </AppNameWrapper>

      <Row>
        <ButtonGroup>
          {/*<Button onClick={getTransactions}>Test get transactions</Button>*/}
          <SettingButton/>
          <SyncButton/>
          <PushButton/>
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