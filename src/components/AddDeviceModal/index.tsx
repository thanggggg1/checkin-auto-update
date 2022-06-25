import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Modal, Select } from "antd";
import { ModalProps } from "antd/es/modal";
import { Device, syncDevices } from "../../store/devices";
import { antdModalLanguageProps, t, useLanguage } from "../../store/settings/languages";
import { useAsyncFn } from "react-use";
import Fetch from "../../utils/Fetch";
import moment from "moment";
import { styled } from "../../global";
import { setSettingDevice } from "../../store/settings/settingDevice";
import Requests from "../../Services/Requests";
import { getPwdChangeParams } from "../../utils/portalCheck";
import { hex_md5 } from "../../utils/hex_md5";

const defaultValue: Device = {
  clientPassword: "", //"123456",
  clientToken: "", //"NzktMTEtZDg1MWZmNGE2ZTM1M2UxMA",
  domain: "", // "https://10.20.1.201:8098",
  name: "", //
  password: "", //"Vcc123**",
  username: "", //"admin",
  status: "Online",
  token: ""
};


export interface AddDeviceModalProps extends ModalProps {
  onClose: () => void;
  device?: Device;
}

const AddDeviceModal = memo(function AddDeviceModal(
  props: AddDeviceModalProps
) {
  useLanguage();
  const [device, setDevice] = useState<Device>(props.device || defaultValue);
  const [valueSelect, setValueSelect] = useState("");

  useEffect(() => {
    setDevice(props.device || defaultValue);
  }, [props.visible]);

  const values = useMemo(() => {
    const onChange = (name: keyof Device, isNumber = false) => (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      event.persist();
      setDevice((oldValue) => ({
        ...oldValue,
        [name]: isNumber ? Number(event.target.value) : event.target.value
      }));
    };
    return {
      onNameChange: onChange("name"),
      onDomainChange: onChange("domain"),
      onUserNameChange: onChange("username"),
      onPasswordChange: onChange("password"),

      onClientTokenChange: onChange("clientToken"),
      onClientPasswordChange: onChange("clientPassword"),
      onDoorChange: onChange("doors"),


      onHeartbeatChange: onChange("heartbeat", true),
      onAutoReconnectChange: onChange("autoReconnect", true)
    };
  }, []);

  const onLastSyncChange = useCallback((value: number) => {
    setDevice({
      ...device,
      lastSync: value,
      startSync:value
    });
  }, []);

  const [{}, validateTokenPassword] = useAsyncFn(async () => {
    try {
      const a = await Fetch.checkTokenIsValid({
        password: device.clientPassword,
        token: device.clientToken,
        sysDomain: "base.vn"
      });
      return a;
    } catch (e) {
      return null;
    }
  }, [device]);

  const [{ loading }, onOk] = useAsyncFn(async () => {
    // @todo Validate device

    if (!device.domain || !device.name || (!device.username) || (!device.password) || !device.clientToken || !device.clientPassword) {
      return Modal.error({
        title: t("please_enter_all_required_fields"),
        ...antdModalLanguageProps
      });
    }
    const isValidPassword = await validateTokenPassword();
    if (!isValidPassword) {
      Modal.error({
        title: t("unable_login"),
        content: t("error_clientToken")
      });
      return;
    }

    //login Device de set Token vao
    try {
      // check password before login
      const res = await new Requests().fetch({
        paramStr: JSON.stringify({
          "url": `${device.domain}/portalPwdEffectiveCheck.do`,
          "method": "post",
          "params": {
            "content": `${getPwdChangeParams(`${device.username}`, `${hex_md5(device.password)}`, "")}`
          }
        })
      });
      // @ts-ignore
      const cookie = res.header._store["set-cookie"][1].split(";")[0].split("=")[1];
      // request login
      const data: any = await new Requests().fetch({
        paramStr: JSON.stringify({
          "url": `${device.domain}/login.do`,
          "method": "post",
          "headers": {
            "Cookie": `SESSION=${cookie}`
          },
          "params": {
            "loginType": "NORMAL",
            "username": `${device.username}`,
            "password": `${hex_md5(device.password)}`
          }
        })
      });

      if (data?.response) {
        setSettingDevice({
          ...device,
          token: data?.header._store["set-cookie"][1].split(";")[0].split("=")[1],
          status: "Online"
        })
        && syncDevices([{ ...device, status: "Online" }]);
      } else {
        Modal.error({
          title: `${t("unable_login")}`,
          content: `${"error_domain"}`
        });
        return;
      }
    } catch (e) {
        Modal.error({
          title: `${t("unable_login")}`,
          content: `${t('error_domain')}`
        });
      return;
    }
    props.onClose();
  }, [device, validateTokenPassword, props.onClose]);

  const handleChangeSelect = useCallback((value) => {
    setValueSelect(value);
  }, [valueSelect]);

  return (
    <Modal
      title={props.device ? t("edit_device") : t("add_device")}
      confirmLoading={loading}
      onCancel={props.onClose}
      onOk={onOk}
      okText={t("OK")}
      cancelText={t("cancel")}
      {...props}
    >
      <Input
        addonBefore={`${t("device_name")} *`}
        placeholder={t("device_name_placeholder")}
        value={device.name}
        onChange={values.onNameChange}
      />
      <br/>
      <br/>
      <Input
        addonBefore={"Domain/Admin*"}
        placeholder={"https://14.241.105.154:8098"}
        value={device.domain}
        onChange={values.onDomainChange}
        disabled={!!props.device}
      />
      <br/>
      <br/>
      <Input
        addonBefore={"Username*"}
        placeholder={"Admin"}
        value={device.username}
        onChange={values.onUserNameChange}
      />
      <br/>
      <br/>
      <Input.Password
        addonBefore={"Password*"}
        placeholder={"Admin"}
        value={device.password}
        onChange={values.onPasswordChange}
      />
      <br/>
      <br/>
      {/** thong tin token lay tu HRM **/}
      <Input.Password
        addonBefore={"Client token *"}
        placeholder={"Client token"}
        value={device.clientToken}
        onChange={values.onClientTokenChange}
      />
      <br/>
      <br/>
      <Input.Password
        addonBefore={"Client password *"}
        placeholder={"Client password"}
        value={device.clientPassword}
        onChange={values.onClientPasswordChange}
      />
      {
        device.startSync
          ? <>
            <br/>
            <br/>
            <Input.Group compact={true}>
              <Input disabled={true} style={{ width: 160 }} value={t<string>("sync_data_from")}/>
              <DatePicker
                showTime={{ format: "DD/MM/YYYY HH:mm" }}
                format="DD/MM/YYYY HH:mm:ss"
                onOk={(value: any) => {
                  onLastSyncChange(value.unix() * 1000);
                }}
                placeholder={""}
                value={moment(device.startSync)}
              />
            </Input.Group>

          </>
          : null
      }

    </Modal>
  );
});

export default AddDeviceModal;

const SelectOption = styled.div`
display: flex;
flex-direction: row;
align-items: center;

`;
const TitleSelectOption = styled.div`
display: flex;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
        background-color: #fafafa;
        padding: 0 11px;
        align-items: center;
        justify-content: center;
        height: 32px;
        border-right-width: 0;
`;

const SelectDropDown = styled(Select)`
flex: 1
`;
