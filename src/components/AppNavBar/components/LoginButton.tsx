import React, { memo, useCallback, useRef } from "react";
import { Button, Input, Modal } from "antd";
import { LoginOutlined } from "@ant-design/icons/lib";
import { useAsyncFn, useBoolean } from "react-use";
import Fetch from "../../../utils/Fetch";
import {
  useLanguage,
  t,
  antdModalLanguageProps,
} from "../../../store/settings/languages";

const LoginButton = memo(function LoginButton() {
  useLanguage();
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
        {t("login")}
      </Button>
      <Modal
        title={t("login")}
        visible={visible}
        onCancel={toggle}
        onOk={onOk}
        {...antdModalLanguageProps}
      >
        <Input
          addonBefore={"Token"}
          placeholder={t("token_from_checkin_client")}
          name={"token"}
          onChange={onChange}
        />
        <br />
        <br />
        <Input
          addonBefore={t("password")}
          placeholder={t("password_from_checkin_client")}
          name={"password"}
          onChange={onChange}
        />
      </Modal>
    </>
  );
});

export default LoginButton;
