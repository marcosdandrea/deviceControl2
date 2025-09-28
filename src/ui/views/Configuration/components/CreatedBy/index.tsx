import React from "react";
import { useContext } from "react";
import { configContext } from "@views/Configuration";
import { Input, Space } from "antd";

const CreatedBy = () => {
    const { createdBy, labelFlex, inputFlex } = useContext(configContext);

    return (
      <Space.Compact style={{ flex: 1 }}>
        <Input value="Creado por" disabled style={{ flex: labelFlex, color: "inherit" }} />
        <Input
          style={{ 
            flex: inputFlex,
            pointerEvents: "none",
        }}
          value={createdBy}
        />
      </Space.Compact>

    );
};

export default CreatedBy;
