import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Modal, Select } from "antd";
import { ModalProps } from "antd/es/modal";
import { Device, DeviceSyncMethod, syncDevices } from "../../store/devices";
import { antdModalLanguageProps, t, translate, useLanguage } from "../../store/settings/languages";
import { useAsyncFn } from "react-use";
import Fetch from "../../utils/Fetch";
import { requestLoginDevice } from "../../store/devices/functions";
import moment from "moment";

const defaultValue: Device = {
  clientPassword: "", //"123456",
  clientToken: "", //"NzktMTctODQxZmJmYjNjMGM3YjJmMw",
  domain: "", // "https://14.241.105.154/",
  name: "", //
  password: "", //"Base@53rv1c3",
  username: "" //"admin"
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
  const onLastSyncChange = (valu: number) => {
    setDevice({
      ...device,
      lastSync: valu
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

    if (!device.domain || !device.name || !device.username || !device.password || !device.clientToken || !device.clientPassword) {
      return Modal.error({
        title: t("please_enter_all_required_fields"),
        ...antdModalLanguageProps
      });
    }

    const r = await requestLoginDevice({
      domain: device.domain,
      password: device.password,
      username: device.username
    });
    if (!r || !r.sessionId) {
      Modal.error({
        title: r.message
      });
      return;
    }
    syncDevices([{ ...device, sessionId: r.sessionId }]);
    props.onClose();
  }, [device, validateTokenPassword, props.onClose]);

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
        addonBefore={"Domain biostar 2 *"}
        placeholder={"https://14.241.105.154"}
        value={device.domain}
        onChange={values.onDomainChange}
      />

      <br/>
      <br/>
      <Input
        addonBefore={"Username *"}
        placeholder={"admin"}
        value={device.username}
        onChange={values.onUserNameChange}
      />

      <br/>
      <br/>
      <Input.Password
        addonBefore={t("device_password") + " *"}
        placeholder={t("device_password_placeholder")}
        value={device.password}
        onChange={values.onPasswordChange}
      />

      {/** thong tin token lay tu HRM **/}
      <br/>
      <br/>
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
