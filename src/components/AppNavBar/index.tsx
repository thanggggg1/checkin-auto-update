import React, { memo } from "react";
import { styled } from "../../global";
import { Button, Row } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import LoginButton from "./components/LoginButton";
import Fetch from "../../utils/Fetch";
import LogoutButton from "./components/LogoutButton";

const Wrapper = styled(Row)`
  padding: 0 16px;
  height: 56px;
`;

const AppName = styled.h1`
  font-size: 20px;
  margin: 0;
`;
const AppNavBar = memo(function AppNavBar() {
  const token = Fetch.useToken();
  console.log("token", token);

  return (
    <Wrapper align={"middle"} justify={"space-between"}>
      <AppName>Base Checkin Station</AppName>

      <Row>{token.token ? <LogoutButton /> : <LoginButton />}</Row>
    </Wrapper>
  );
});

export default AppNavBar;
