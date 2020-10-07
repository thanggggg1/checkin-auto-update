import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { Button, Input, Modal, Select } from "antd";
import { LoginOutlined } from "@ant-design/icons/lib";
import { useAsyncFn, useBoolean } from "react-use";
import Fetch from "../../../utils/Fetch";
import {
  useLanguage,
  t,
  antdModalLanguageProps,
} from "../../../store/settings/languages";
import _ from "lodash";

const LoginButton = memo(function LoginButton() {
  useLanguage();
  const [visible, toggle] = useBoolean(false);
  const [serverSelectVisible, toggleServerSelect] = useBoolean(false);
  const token = useRef<string>("");
  const password = useRef<string>("");
  const [sysDomain, setSysDomain] = useState("base.vn");

  const [{}, onOk] = useAsyncFn(async () => {
    try {
      await Fetch.checkTokenIsValid({
        password: password.current,
        token: token.current,
        sysDomain: sysDomain,
      });
      toggle();
    } catch (e) {
      Modal.error({ title: e.message });
    }
  }, [token, password, sysDomain]);

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "token") return (token.current = value);
    if (name === "password") return (password.current = value);
  }, []);

  const onAuxClickPassword = useMemo(() => _.after(5, toggleServerSelect), [
    toggleServerSelect,
  ]);

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
          onAuxClick={onAuxClickPassword}
        />

        <br />
        <br />
        {serverSelectVisible && (
          <Select
            placeholder={"System domain"}
            onSelect={setSysDomain}
            value={sysDomain}
          >
            <Select.Option value={"base.vn"}>base.vn</Select.Option>
            <Select.Option value={"basevn.tech"}>basevn.tech</Select.Option>
            <Select.Option value={"base.com.vn"}>base.com.vn</Select.Option>
          </Select>
        )}
      </Modal>
    </>
  );
});

export default LoginButton;
