import React from "react";
import { useContext } from "react";
import { Input, Space } from "antd";
import { configContext } from "@views/Configuration/context";

const ProjectName = () => {
    const { projectName, setProjectName, labelFlex, inputFlex } = useContext(configContext);

    const handleOnChangeProjectName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProjectName(e.target.value);
    };

    return (
      <Space.Compact style={{ flex: 1 }}>
        <Input value="Nombre del proyecto" disabled style={{ flex: labelFlex, color: "inherit" }} />
        <Input
          style={{ flex: inputFlex}}
          value={projectName}
          status={projectName.trim() === "" || projectName.length < 3 ? "error" : ""}
          onChange={handleOnChangeProjectName}
        />
      </Space.Compact>

    );
};

export default ProjectName