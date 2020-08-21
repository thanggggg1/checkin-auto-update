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
  const [device, setDevice] = useState<Device>(defaultValue);

  const values = useMemo(() => {
    const onChange = (name: keyof Device) => (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      event.persist();
      setDevice((oldValue) => ({
        ...oldValue,
        [name]: event.target.value,
      }));
    };
    return {
      onNameChange: onChange("name"),
      onIpChange: onChange("ip"),
      onPortChange: onChange("port"),
      onConnectionChange: (type: Device["connection"]) =>
        setDevice((old) => ({
          ...old,
          connection: type,
        })),
    };
  }, []);

  const onOk = useCallback(() => {
    // @todo Validate device

    if (!device.ip || !device.name || !device.port) {
      return Modal.error({
        title: "Please enter all required fields",
      });
    }

    if (
      !/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        device.ip
      )
    ) {
      return Modal.error({
        title: "Please enter an valid IP address",
      });
    }

    syncDevices([device]);
    props.onClose();
  }, [device, props.onClose]);

  return (
    <Modal title={"Add device"} onOk={onOk} {...props}>
      <Input
        addonBefore={"Device name"}
        placeholder={"Ex: Main door attendance machine"}
        value={device.name}
        onChange={values.onNameChange}
      />
      <br />
      <br />
      <Input
        addonBefore={"Device IP"}
        placeholder={"Ex: 192.168.0.5, 10.20.0.4"}
        value={device.ip}
        onChange={values.onIpChange}
      />
      <br />
      <br />
      <Input
        addonBefore={"Device Port"}
        placeholder={"Default port is 4370"}
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
    </Modal>
  );
});

export default AddDeviceModal;
