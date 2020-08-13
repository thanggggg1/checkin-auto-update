import React, { memo } from "react";
import { Col, Input, Modal, Select } from "antd";
import { ModalProps } from "antd/es/modal";
import { Option } from "antd/es/mentions";

export interface AddDeviceModalProps extends ModalProps {}
const AddDeviceModal = memo(function AddDeviceModal(
  props: AddDeviceModalProps
) {
  return (
    <Modal title={"Add device"} {...props}>
      <Input
        addonBefore={"Device name"}
        placeholder={"Ex: Main door attendance machine"}
      />
      <br />
      <br />
      <Input
        addonBefore={"Device IP"}
        placeholder={"Ex: 192.168.0.5, 10.20.0.4"}
      />
      <br />
      <br />
      <Input
        addonBefore={"Device Port"}
        placeholder={"Default port is 4370"}
        defaultValue={4370}
      />
      <br />
      <br />
      <Input.Group>
        <Select defaultValue={"tcp"}>
          <Option value={"tcp"}>TCP</Option>
          <Option value={"udp"}>UDP</Option>
        </Select>
      </Input.Group>
    </Modal>
  );
});

export default AddDeviceModal;
