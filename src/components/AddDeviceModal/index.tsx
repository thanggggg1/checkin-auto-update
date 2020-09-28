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
}
const AddDeviceModal = memo(function AddDeviceModal(
  props: AddDeviceModalProps
) {
  useLanguage();
  const [device, setDevice] = useState<Device>(defaultValue);

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
      title={t("add_device")}
      onOk={onOk}
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
        addonBefore={"Heartbeat rate"}
        placeholder={t(
          "The time rate to check if the device is still connected"
        )}
        addonAfter={t("minutes")}
        value={device.heartbeat || 1}
        onChange={values.onHeartbeatChange}
        type={"number"}
        step={1}
        min={1}
      />
      <p>
        The time rate to check if the device is still connected. If your device
        is low-end or not performance, set it higher.
      </p>
      <Input
        addonBefore={"Auto reconnect rate"}
        placeholder={t(
          "The time rate to auto reconnect if device is not connected"
        )}
        addonAfter={t("seconds")}
        value={device.autoReconnect || 30}
        onChange={values.onAutoReconnectChange}
        type={"number"}
        step={30}
        min={30}
      />
      <p>
        The time rate to auto reconnect if device is not connected. If your
        device is low-end or not performance, set it higher.
      </p>
    </Modal>
  );
});

export default AddDeviceModal;
