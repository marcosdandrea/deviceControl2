import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { Input } from "antd";
import { configContext } from "@views/ConfigurationLegacy/context";
import SettingRow from "@components/SettingRow";
import useDebounce from "@hooks/useDebounce";

const Description = () => {
  const { description, setDescription } = useContext(configContext);
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
    <SettingRow label="Descripción" vertical>
      <Input.TextArea
        style={{ resize: "none" }}
        value={localValue}
        onChange={handleOnDescriptionChange}
        rows={3}
        maxLength={200}
      />
    </SettingRow>
  );
};

export default Description;
