import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Modal, Select } from "antd";
import { ModalProps } from "antd/es/modal";
import { Device, syncDevices } from "../../store/devices";
import { antdModalLanguageProps, t, useLanguage } from "../../store/settings/languages";
import { useAsyncFn } from "react-use";
import Fetch from "../../utils/Fetch";
import moment from "moment";
import { Option } from "antd/es/mentions";
import { styled } from "../../global";
import { requestLoginDevice } from "../../store/devices/functions";

const defaultValue: Device = {
  clientPassword: "", //"123456",
  clientToken: "", //"NzktMTctODQxZmJmYjNjMGM3YjJmMw",
  domain: "", // "https://14.241.105.154/",
  name: "", //
  password: "", //"Base@53rv1c3",
  username: "", //"admin",
  apiToken: "",
  status:'',
  cookie:''
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
      onApiTokenChange: onChange("apiToken"),
      onUserNameChange: onChange("username"),
      onPasswordChange: onChange("password"),

      onClientTokenChange: onChange("clientToken"),
      onClientPasswordChange: onChange("clientPassword"),
      onDoorChange: onChange("doors"),


      onHeartbeatChange: onChange("heartbeat", true),
      onAutoReconnectChange: onChange("autoReconnect", true)
    };
  }, []);

  const onLastSyncChange = (value: number) => {
    setDevice({
      ...device,
      lastSync: value
    });
  };

  const [{}, validateTokenPassword] = useAsyncFn(async () => {
    try {
      const a = await Fetch.checkTokenIsValid({
        password: device.clientPassword,
        token: device.clientToken,
        sysDomain: "base.vn"
      });
      return a;
    } catch (e) {
      console.log("okokokokok");
      Modal.error({ title: e.message });
      return null;
    }
  }, [device]);

  const [{ loading }, onOk] = useAsyncFn(async () => {
    // @todo Validate device

    if (!device.domain || !device.name || (!device.username && !device.password && !device.apiToken) || !device.clientToken || !device.clientPassword) {
      return Modal.error({
        title: t("please_enter_all_required_fields"),
        ...antdModalLanguageProps
      });
    }

    // const r = await requestLoginDevice({
    //   domain:device.domain,
    //   username:device.username,
    //   password:device.password
    // })

    // const r = await requestLoginDevice({
    //   domain: device.domain,
    //   password: device.password,
    //   username: device.username
    // });
    // if (!r || !r.sessionId) {
    //   Modal.error({
    //     title: r.message
    //   });
    //   return;
    // }
    // syncDevices([{ ...device, sessionId: r.sessionId }]);
    syncDevices([{ ...device }]);
    props.onClose();
  }, [device, validateTokenPassword, props.onClose]);

  const handleChangeSelect = useCallback((value) => {
    setValueSelect(value);
  }, [valueSelect]);


  return (
    <Modal
      title={props.device ? t("edit_device") : t("add_device")}
      onOk={onOk}
      onCancel={props.onClose}
      {...props}
      {...antdModalLanguageProps}
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
      />
      <br/>
      <br/>

      <SelectOption>
        <TitleSelectOption>
          License Activation*
        </TitleSelectOption>
        <SelectDropDown
          showSearch
          placeholder="Have you activated ZkBioSecurity?"
          onChange={handleChangeSelect}
        >
          <Option value="1">Activated</Option>
          <Option value="0">Non Active</Option>
        </SelectDropDown>
      </SelectOption>

      <br/>
      {valueSelect == "1" ?
        <>
          <Input
            addonBefore={"API Token*"}
            placeholder={"17420CDAA50F7B55CE7AC3B75BD8FB7D66B34B6A61033CCAA4D388AECDFA9C1D"}
            value={device.apiToken}
            onChange={values.onApiTokenChange}
          />
          <br/>
          <br/>
        </> :
        <>
          <Input
            addonBefore={"Username"}
            placeholder={"Admin"}
            value={device.username}
            onChange={values.onUserNameChange}
          />
          <br/>
          <br/>
          <Input
            addonBefore={"Password"}
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
      <br/>
      <br/>
      <Input
        addonBefore={"Cửa nhận log (Danh sách ID cửa)"}
        placeholder={"5419191, 5356245, ... "}
        value={device.doors || ""}
        onChange={values.onDoorChange}
      />
      {
        device.lastSync
          ? <>
            <br/>
            <br/>
            <Input.Group compact={true}>
              <Input disabled={true} style={{ width: 100 }} value={"Thời gian đồng bộ từ: "}/>
              <DatePicker
                showTime={{ format: "DD/MM/YYYY" }}
                format="DD/MM/YYYY"
                onChange={(value: any) => {
                  onLastSyncChange(value.unix() * 1000);
                }}
                placeholder={""}
                value={moment(device.lastSync)}
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
