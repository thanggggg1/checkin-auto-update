import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Input, Modal, Select } from "antd";
import { ModalProps } from "antd/es/modal";
import { Device, DeviceSyncMethod, syncDevices } from "../../store/devices";
import { antdModalLanguageProps, t, translate, useLanguage } from "../../store/settings/languages";
import { useAsyncFn } from "react-use";
import Fetch from "../../utils/Fetch";

const defaultValue: Device = {
  name: "",
  ip: "",
  connection: "tcp",
  port: 4370,
  syncMethod: DeviceSyncMethod.PY,
  clientToken: '',
  clientPassword: ''
};

const domainRegex = /^(?!-)(?:[a-zA-Z\d\-]{0,62}[a-zA-Z\d]\.){1,126}(?!\d+)[a-zA-Z\d]{1,63}$/;

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
    setDevice(props.device || defaultValue)
  }, [props.visible]);

  const values = useMemo(() => {
    const onChange = (name: keyof Device, isNumber = false) => (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      event.persist();
      setDevice((oldValue) => ({
        ...oldValue,
        [name]: isNumber ? Number(event.target.value) : event.target.value,
      }));
    };
    return {
      onNameChange: onChange("name"),
      onIpChange: onChange("ip"),
      onPortChange: onChange("port", true),
      onConnectionChange: (type: Device["connection"]) =>
        setDevice((old) => ({
          ...old,
          connection: type,
        })),
      onMethodChange: (method: Device["syncMethod"]) => {
        setDevice((old) => ({ ...old, syncMethod: method }));
      },
      onPasswordChange: onChange('password'),
      onClientTokenChange: onChange('clientToken'),
      onClientPasswordChange: onChange('clientPassword'),
      onHeartbeatChange: onChange("heartbeat", true),
      onAutoReconnectChange: onChange("autoReconnect", true),
    };
  }, []);

  const [{}, validateTokenPassword] = useAsyncFn(async () => {
    try {
      const a = await Fetch.checkTokenIsValid({
        password: device.clientPassword,
        token: device.clientToken,
        sysDomain: 'base.vn',
      });
      return a
    } catch (e) {
      Modal.error({ title: e.message });
      return null
    }
  }, [device]);

  const [{loading}, onOk] = useAsyncFn(async () => {
    // @todo Validate device

    if (!device.ip || !device.name || !device.port || !device.clientToken || !device.clientPassword) {
      return Modal.error({
        title: t("please_enter_all_required_fields"),
        ...antdModalLanguageProps,
      });
    }

    if (
      !(
        /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          device.ip
        ) ||
        /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(
          device.ip
        ) ||
        domainRegex.test(device.ip)
      )
    ) {
      return Modal.error({
        title: t("please_enter_an_valid_ip_address"),
        ...antdModalLanguageProps,
      });
    }
    // const r = await validateTokenPassword();
    // console.log('r ', r)
    // if (!r) {
    //   return
    // }
    syncDevices([device]);
    props.onClose();
  }, [device, validateTokenPassword, props.onClose]);

  const isIpDangerous = useMemo(() => {
    return /^(?!-)(?:[a-zA-Z\d\-]{0,62}[a-zA-Z\d]\.){1,126}(?!\d+)[a-zA-Z\d]{1,63}$/.test(
      device.ip
    );
  }, [device.ip]);

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
      <br />
      <br />
      <Input
        addonBefore={`${t("device_ip")} *`}
        placeholder={t("device_ip_placeholder")}
        value={device.ip}
        onChange={values.onIpChange}
        disabled={!!props.device}
      />
      {isIpDangerous && (
        <span style={{ color: "#ff4d4f" }}>{translate("ip_dangerous")}</span>
      )}
      <br />
      <br />
      <Input
        addonBefore={t("device_port")}
        placeholder={t("device_port_placeholder")}
        value={device.port}
        onChange={values.onPortChange}
      />
      {device.syncMethod === DeviceSyncMethod.PY && <>
        <br />
        <br />
        <Input.Password
          addonBefore={t("device_password")}
          placeholder={t("device_password_placeholder")}
          value={device.password}
          onChange={values.onPasswordChange}
        />
      </>}

      {/** thong tin token lay tu HRM **/}
      <br />
      <br />
      <Input.Password
        addonBefore={'Client token *'}
        placeholder={'Client token'}
        value={device.clientToken}
        onChange={values.onClientTokenChange}
      />

      <br />
      <br />
      <Input.Password
        addonBefore={'Client password *'}
        placeholder={'Client password'}
        value={device.clientPassword}
        onChange={values.onClientPasswordChange}
      />
      {/** validate khi tao moi va edit cai device nay **/}
      <br />
      <br />
      <span className="ant-input-group-wrapper">
        <span className="ant-input-wrapper ant-input-group">
          <span className="ant-input-group-addon">
            {translate("connection_type")}
          </span>
          <Select
            value={device.connection}
            onChange={values.onConnectionChange}
          >
            <Select.Option value={"tcp"}>TCP</Select.Option>
            <Select.Option value={"udp"}>UDP</Select.Option>
          </Select>
        </span>
      </span>

      {device.syncMethod !== DeviceSyncMethod.PY && (
        <>
          <br />
          <br />
          <Input
            addonBefore={t("heartbeat_rate")}
            placeholder={t("heartbeat_rate_desc")}
            addonAfter={t("minutes")}
            value={device.heartbeat || 1}
            onChange={values.onHeartbeatChange}
            type={"number"}
            step={1}
            min={1}
          />
        </>
      )}
      <p>{t("heartbeat_rate_desc")}</p>
      <Input
        addonBefore={t("auto_reconnect")}
        placeholder={t("auto_reconnect_desc")}
        addonAfter={t("seconds")}
        value={device.autoReconnect || 30}
        onChange={values.onAutoReconnectChange}
        type={"number"}
        step={30}
        min={30}
        inputMode={"decimal"}
      />
      <p>{t("auto_reconnect_desc")}</p>
      <span className="ant-input-group-wrapper">
        <span className="ant-input-wrapper ant-input-group">
          <span className="ant-input-group-addon">
            {translate("sync_method")}
          </span>
          <Select
            value={device.syncMethod || DeviceSyncMethod.PY}
            onChange={values.onMethodChange}
          >
            <Select.Option value={DeviceSyncMethod.PY}>Pyatt</Select.Option>
            <Select.Option value={DeviceSyncMethod.LARGE_DATASET}>
              Large dataset
            </Select.Option>
            <Select.Option value={DeviceSyncMethod.LEGACY}>
              Legacy
            </Select.Option>
          </Select>
        </span>
      </span>
    </Modal>
  );
});

export default AddDeviceModal;
