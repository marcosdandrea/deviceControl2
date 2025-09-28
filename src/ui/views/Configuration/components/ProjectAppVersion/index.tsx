import React from "react";
import { useContext } from "react";
import { configContext } from "@views/Configuration";
import { Input, Space } from "antd";

const ProjectAppVersion = () => {
    const { appVersion, labelFlex, inputFlex } = useContext(configContext);

    return (
      <Space.Compact style={{ flex: 1 }}>
        <Input value="Creado con la versión" disabled style={{ flex: labelFlex, color: "inherit" }} />
        <Input
          style={{ flex: inputFlex, pointerEvents: "none" }}
          value={appVersion}
          
        />
      </Space.Compact>

    );
};

export default ProjectAppVersion;
