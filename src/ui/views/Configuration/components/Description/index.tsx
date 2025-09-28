import React from "react";
import { useContext } from "react";
import { configContext } from "@views/Configuration";
import { Input, Space } from "antd";

const Description = () => {
  const { description, setDescription, labelFlex, inputFlex } =
    useContext(configContext);

  const handleOnDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  return (
    <Space.Compact style={{ flex: 1 }}>
      <Input
        value="Descripción"
        disabled
        style={{ flex: labelFlex, color: "inherit" }}
      />
      <Input.TextArea
        style={{ flex: inputFlex, resize: "none" }}
        value={description}
        onChange={handleOnDescriptionChange}
        rows={3}
        maxLength={200}
      />
    </Space.Compact>
  );
};

export default Description;
