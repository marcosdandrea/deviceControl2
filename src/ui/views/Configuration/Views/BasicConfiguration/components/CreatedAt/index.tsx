import React from "react";
import { useContext } from "react";
import { Input, Space } from "antd";
import { configContext } from "@views/Configuration/context";

const CreatedAt = () => {
    const { createdAt, labelFlex, inputFlex } = useContext(configContext);

    return (
      <Space.Compact style={{ flex: 1 }}>
        <Input value="Creado el" disabled style={{ flex: labelFlex, color: "inherit" }} />
        <Input
          style={{ flex: inputFlex, pointerEvents: "none" }}
          value={createdAt.toLocaleString()}
        />
      </Space.Compact>

    );
};

export default CreatedAt;