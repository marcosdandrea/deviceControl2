import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { Input, Space } from "antd";
import { configContext } from "@views/Configuration/context";
import useDebounce from "@hooks/useDebounce";

const Description = () => {
  const { description, setDescription, labelFlex, inputFlex } = useContext(configContext);
  const [localValue, setLocalValue] = useState(description || "");
  const debouncedValue = useDebounce(localValue, 500);

  // Sincronizar el valor debounced con el contexto
  useEffect(() => {
    if (debouncedValue !== description) {
      setDescription(debouncedValue);
    }
  }, [debouncedValue, setDescription]);

  // Sincronizar cuando cambie el valor del contexto externamente
  useEffect(() => {
    setLocalValue(description || "");
  }, [description]);

  const handleOnDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
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
        value={localValue}
        onChange={handleOnDescriptionChange}
        rows={3}
        maxLength={200}
      />
    </Space.Compact>
  );
};

export default Description;
