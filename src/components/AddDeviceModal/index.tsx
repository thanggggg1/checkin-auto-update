import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Modal, Select } from "antd";
import { ModalProps } from "antd/es/modal";
import { Device, DeviceSyncMethod, syncDevices } from "../../store/devices";
import { t, useLanguage } from "../../store/settings/languages";
import { useAsyncFn } from "react-use";
import Fetch from "../../utils/Fetch";
import moment from "moment";
import { styled } from "../../global";
import Requests from "../../Services/Requests";
import { getPwdChangeParams } from "../../utils/portalCheck";
import { hex_md5 } from "../../utils/hex_md5";
import { setSettingMode } from "../../store/settings/settingMode";
import { setSettingZkBioSystem, useSettingZkBioSystem } from "../../store/settings/settingZkBioSystem";

const defaultValue: Device = {
  clientPassword: "", //"123456",
  clientToken: "", //"NzktMTEtZDg1MWZmNGE2ZTM1M2UxMA",
  domain: "", // "https://10.20.1.201:8098",
  name: "", //
  password: "", //"Vcc123**",
  username: "", //"admin",
  status: "Online",
  token: "",
  syncMethod: "",
  connection: "tcp"
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
  const [mode, setMode] = useState("multi_mcc");
  const isZkBioSystem = useSettingZkBioSystem();

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
      onIPinChange: onChange("ip"),
      onPORTinChange: onChange("port"),
      onUserNameChange: onChange("username"),
      onPasswordChange: onChange("password"),

      onConnectionChange: (type: Device["connection"]) =>
        setDevice((old) => ({
          ...old,
          connection: type
        })),

      onMethodChange: (method: Device["syncMethod"]) => {
        setDevice((old) => ({ ...old, syncMethod: method }));
      },

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
      lastSync: value
    });
  }, []);

  const onChangeMode = useCallback((value: any) => {
    setMode(value);
    setSettingMode(value);
  }, [mode]);

  const [{}, validateTokenPassword] = useAsyncFn(async () => {
    try {
      const a = await Fetch.checkTokenIsValid({
        password: device.clientPassword,
        token: device.clientToken,
        sysDomain: "base.vn"
      });
      console.log("a", a);
      return a;
    } catch (e) {
      return null;
    }
  }, [device]);

  const [{ loading }, onOk] = useAsyncFn(async () => {
    // @todo Validate device

    // if (!device.domain || !device.name || (!device.username) || (!device.password) || !device.clientToken || !device.clientPassword) {
    //   return Modal.error({
    //     title: t("please_enter_all_required_fields"),
    //     ...antdModalLanguageProps
    //   });
    // }
    const isValidPassword = await validateTokenPassword();
    if (!isValidPassword) {
      Modal.error({
        title: t("unable_login"),
        content: t("error_clientToken")
      });
      return;
    }

    //login Device de set Token vao
    if (mode == "zk_teco") {
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
          setSettingZkBioSystem(true);
          syncDevices([{
            ...device,
            token: data?.header._store["set-cookie"][1].split(";")[0].split("=")[1],
            status: "Online"
          }]);
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
          content: `${t("error_domain")}`
        });
        return;
      }
    }
    if (mode !== "zk_teco") {
      if (device.ip) {
        syncDevices([{ ...device, domain: device.ip, status: "Online" }]);
      } else syncDevices([{ ...device, status: "Online" }]);
    }
    props.onClose();
  }, [device, validateTokenPassword, props.onClose]);

  const handleChangeSelect = useCallback((value) => {
    setValueSelect(value);
  }, [valueSelect]);
  // @ts-ignore
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
      <span className="ant-input-group-wrapper">
        <span className="ant-input-wrapper ant-input-group">
          <span className="ant-input-group-addon">
            Chọn phiên bản*
          </span>
          <SelectDropDown
            value={mode}
            onChange={onChangeMode}
          >
            <Select.Option value={"multi_mcc"}>Access Directly</Select.Option>
            <Select.Option
              disabled={!!isZkBioSystem}
              value={"zk_teco"}>Zk Bio Security</Select.Option>
            <Select.Option value={"bio_star"}>Bio Star</Select.Option>
          </SelectDropDown>
        </span>
      </span>
      <br/>
      <br/>
      {
        isZkBioSystem && <p style={{ fontStyle: "italic" }}>{"*You can only add one system of ZkBioSecurity*"}</p>
      }
      {
        mode === "zk_teco" || mode === "bio_star" ?

          <Input
            addonBefore={"Domain/Admin*"}
            placeholder={"https://14.241.105.154:8098"}
            value={device.domain}
            onChange={values.onDomainChange}
            disabled={!!props.device}
          /> :
          <>
            <Input
              addonBefore={"IP Address*"}
              placeholder={"Ex:192.168.0.5, 10.20.0.4"}
              value={device.ip}
              onChange={values.onIPinChange}
              disabled={!!props.device}
            />
            <br/>
            <br/>
            <Input
              addonBefore={"Port*"}
              placeholder={"Ex: 4370"}
              value={device.port}
              onChange={values.onPORTinChange}
              disabled={!!props.device}
            />
          </>
      }
      <br/>
      <br/>
      {
        (mode === "zk_teco" || mode == "bio_star") &&
        <>
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
        </>
      }
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
        mode == "bio_star" &&
        <>
          <br/>
          <br/>
          <Input
            addonBefore={"Cửa nhận log (Danh sách ID cửa)"}
            placeholder={"5419191, 5356245, ..... "}
            value={device.doors || ""}
            onChange={values.onDoorChange}
          />
        </>
      }
      {mode == "multi_mcc" &&
      <>
        <br/>
        <br/>
        <span className="ant-input-group-wrapper">
        <span className="ant-input-wrapper ant-input-group">
          <span className="ant-input-group-addon">
                  Connection Type
          </span>
          <SelectDropDown
            value={device.connection}
            // @ts-ignore
            onChange={values.onConnectionChange}
          >
            <Select.Option value={"tcp"}>TCP</Select.Option>
            <Select.Option value={"udp"}>UDP</Select.Option>
          </SelectDropDown>
        </span>
      </span>
      </>
      }

      {device.syncMethod !== DeviceSyncMethod.PY && mode === "multi_mcc" && (
        <>
          <br/>
          <br/>
          <Input
            addonBefore={"Heartbeat rate"}
            placeholder={"The rate to  check the connection between this app and the attendance machine. If your machine is low=end or not performance, you should set"}
            addonAfter={"minutes"}
            value={device.heartbeat || 1}
            onChange={values.onHeartbeatChange}
            type={"number"}
            step={1}
            min={1}
          />
        </>
      )}
      {
        mode === "multi_mcc" &&
        <>
          <p>{"The rate to  check the connection between this app and the attendance machine. If your machine is low=end or not performance, you should set"}</p>
          <Input
            addonBefore={"Auto reconnect rate"}
            placeholder={"The rate that this app will reconnect to the attendance machine if not connectedThe rate that this app will reconnect to the attendance machine if not connected"}
            addonAfter={"seconds"}
            value={device.autoReconnect || 30}
            onChange={values.onAutoReconnectChange}
            type={"number"}
            step={30}
            min={30}
            inputMode={"decimal"}
          />
          <p>{"The rate to  check the connection between this app and the attendance machine. If your machine is low=end or not performance, you should set"}</p>
          <span className="ant-input-group-wrapper">
        <span className="ant-input-wrapper ant-input-group">
          <span className="ant-input-group-addon">
            Sync method
          </span>
          <SelectDropDown
            value={device.syncMethod || DeviceSyncMethod.PY}
            // @ts-ignore
            onChange={values.onMethodChange}
          >
            <Select.Option value={DeviceSyncMethod.PY}>Pyatt</Select.Option>
            <Select.Option value={DeviceSyncMethod.LARGE_DATASET}>
              Large dataset
            </Select.Option>
            <Select.Option value={DeviceSyncMethod.LEGACY}>
              Legacy
            </Select.Option>
          </SelectDropDown>
        </span>
      </span>
        </>
      }
      {
        device.lastSync && (mode === "zk_teco" || mode === "bio_star") &&
        <>
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
              value={moment(device.lastSync)}
            />
          </Input.Group>
        </>
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
flex: 1;
width: 100%;
`;
