import React, { memo, useCallback, useRef } from "react";
import { Button, Input, Modal } from "antd";
import { LoginOutlined } from "@ant-design/icons/lib";
import { useAsyncFn, useBoolean } from "react-use";
import Fetch from "../../../utils/Fetch";

const LoginButton = memo(function LoginButton() {
  const [visible, toggle] = useBoolean(false);
  const token = useRef<string>("");
  const password = useRef<string>("");

  const [{}, onOk] = useAsyncFn(async () => {
    try {
      await Fetch.checkTokenIsValid({
        password: password.current,
        token: token.current,
      });
      toggle();
    } catch (e) {
      Modal.error({ title: e.message });
    }
  }, [token, password]);

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "token") return (token.current = value);
    if (name === "password") return (password.current = value);
  }, []);

  return (
    <>
      <Button type={"primary"} icon={<LoginOutlined />} onClick={toggle}>
        Login
      </Button>
      <Modal title={"Login"} visible={visible} onCancel={toggle} onOk={onOk}>
        <Input
          addonBefore={"Token"}
          placeholder={"Token from Checkin client"}
          name={"token"}
          onChange={onChange}
        />
        <br />
        <br />
        <Input
          addonBefore={"Password"}
          placeholder={"Password from Checkin client"}
          name={"password"}
          onChange={onChange}
        />
      </Modal>
    </>
  );
});

export default LoginButton;
