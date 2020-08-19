import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { LogoutOutlined } from "@ant-design/icons/lib";
import Fetch from "../../../utils/Fetch";

const LogoutButton = memo(function LogoutButton() {
  const onPress = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to logout",
      content: "You will no longer can push attendance events to Base",
      onOk: () => {
        Fetch.setToken({
          token: "",
          password: "",
        });
      },
    });
  }, []);

  return (
    <Button onClick={onPress}>
      Logout <LogoutOutlined />
    </Button>
  );
});

export default LogoutButton;
