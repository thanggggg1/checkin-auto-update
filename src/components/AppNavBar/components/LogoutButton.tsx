import React, { memo, useCallback } from "react";
import { Button, Modal } from "antd";
import { LogoutOutlined } from "@ant-design/icons/lib";
import Fetch from "../../../utils/Fetch";
import { useLanguage, t, antdModalLanguageProps } from "../../../store/settings/languages";

const LogoutButton = memo(function LogoutButton() {
  useLanguage();

  const onPress = useCallback(() => {
    Modal.confirm({
      title: t('logout_confirm_title'),
      content: t('logout_confirm_desc'),
      onOk: () => {
        Fetch.setToken({
          token: "",
          password: "",
        });
      },
      ...antdModalLanguageProps
    });
  }, []);

  return (
    <Button onClick={onPress}>
      {t('logout')} <LogoutOutlined />
    </Button>
  );
});

export default LogoutButton;
