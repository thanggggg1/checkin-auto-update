import React, { memo } from "react";
import { styled } from "../../global";
import { Row } from "antd";
import LoginButton from "./components/LoginButton";
import Fetch from "../../utils/Fetch";
import LogoutButton from "./components/LogoutButton";
import PushButton from "./components/PushButton";
import ButtonGroup from "antd/lib/button/button-group";
import SyncButton from "./components/SyncButton";
import SettingButton from "./components/SettingButton";

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

  return (
    <Wrapper align={"middle"} justify={"space-between"}>
      <AppNameWrapper>
        <AppName>Base Checkin Client</AppName>
        <span>v{require("electron").remote.app.getVersion()}</span>
      </AppNameWrapper>

      <Row>
        <ButtonGroup>
          <SettingButton />
          <SyncButton />
          {token.token ? (
            <>
              <PushButton />
              <LogoutButton />
            </>
          ) : (
            <LoginButton />
          )}
        </ButtonGroup>
      </Row>
    </Wrapper>
  );
});

export default AppNavBar;
