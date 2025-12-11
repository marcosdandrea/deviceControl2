import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { Input, Space } from "antd";
import { configContext } from "@views/Configuration/context";
import useDebounce from "@hooks/useDebounce";

const ProjectName = () => {
    const { projectName, setProjectName, labelFlex, inputFlex } = useContext(configContext);
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
      <Space.Compact style={{ flex: 1 }}>
        <Input value="Nombre del proyecto" disabled style={{ flex: labelFlex, color: "inherit" }} />
        <Input
          style={{ flex: inputFlex}}
          value={localValue}
          status={localValue.trim() === "" || localValue.length < 3 ? "error" : ""}
          onChange={handleOnChangeProjectName}
        />
      </Space.Compact>

    );
};

export default ProjectName