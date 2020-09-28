import React, {
  ChangeEvent,
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Input, Modal, Select } from "antd";
import { ModalProps } from "antd/es/modal";
import { Device, syncDevices } from "../../store/devices";
import {
  antdModalLanguageProps,
  t,
  useLanguage,
} from "../../store/settings/languages";

const defaultValue: Device = {
  name: "",
  ip: "",
  connection: "tcp",
  port: 4370,
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
      onHeartbeatChange: onChange("heartbeat", true),
      onAutoReconnectChange: onChange("autoReconnect", true),
    };
  }, []);

  const onOk = useCallback(() => {
    // @todo Validate device

    if (!device.ip || !device.name || !device.port) {
      return Modal.error({
        title: t("please_enter_all_required_fields"),
        ...antdModalLanguageProps,
      });
    }

    if (
      !/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        device.ip
      )
    ) {
      return Modal.error({
        title: t("please_enter_an_valid_ip_address"),
        ...antdModalLanguageProps,
      });
    }

    syncDevices([device]);
    props.onClose();
  }, [device, props.onClose]);

  return (
    <Modal
      title={props.device ? t("edit_device") : t("add_device")}
      onOk={onOk}
      onCancel={props.onClose}
      {...props}
      {...antdModalLanguageProps}
    >
      <Input
        addonBefore={t("device_name")}
        placeholder={t("device_name_placeholder")}
        value={device.name}
        onChange={values.onNameChange}
      />
      <br />
      <br />
      <Input
        addonBefore={t("device_ip")}
        placeholder={t("device_ip_placeholder")}
        value={device.ip}
        onChange={values.onIpChange}
        disabled={!!props.device}
      />
      <br />
      <br />
      <Input
        addonBefore={t("device_port")}
        placeholder={t("device_port_placeholder")}
        value={device.port}
        onChange={values.onPortChange}
      />
      <br />
      <br />
      <Input.Group>
        <Select value={device.connection} onChange={values.onConnectionChange}>
          <Select.Option value={"tcp"}>TCP</Select.Option>
          <Select.Option value={"udp"}>UDP</Select.Option>
        </Select>
      </Input.Group>

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
      />
      <p>{t("auto_reconnect_desc")}</p>
    </Modal>
  );
});

export default AddDeviceModal;
