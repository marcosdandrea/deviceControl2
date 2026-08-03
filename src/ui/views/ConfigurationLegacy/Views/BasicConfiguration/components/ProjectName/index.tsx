import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { Input } from "antd";
import { configContext } from "@views/ConfigurationLegacy/context";
import SettingRow from "@components/SettingRow";
import useDebounce from "@hooks/useDebounce";

const ProjectName = () => {
    const { projectName, setProjectName } = useContext(configContext);
    const [localValue, setLocalValue] = useState(projectName);
    const debouncedValue = useDebounce(localValue, 300);

    // Sincronizar el valor debounced con el contexto
    useEffect(() => {
        if (debouncedValue !== projectName) {
            setProjectName(debouncedValue);
        }
    }, [debouncedValue, setProjectName]);

    // Sincronizar cuando cambie el valor del contexto externamente
    useEffect(() => {
        setLocalValue(projectName);
    }, [projectName]);

    const handleOnChangeProjectName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    return (
      <SettingRow label="Nombre del proyecto">
        <Input
          style={{ width: 320 }}
          value={localValue}
          status={localValue.trim() === "" || localValue.length < 3 ? "error" : ""}
          onChange={handleOnChangeProjectName}
        />
      </SettingRow>
    );
};

export default ProjectName