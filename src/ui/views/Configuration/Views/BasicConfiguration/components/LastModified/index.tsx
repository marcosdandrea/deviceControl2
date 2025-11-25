import React from "react";
import { useContext } from "react";
import { Input, Space } from "antd";
import { configContext } from "@views/Configuration/context";

const LastModified = () => {
    const { updatedAt, labelFlex, inputFlex } = useContext(configContext);

    return (
      <Space.Compact style={{ flex: 1 }}>
        <Input value="Última modificación" disabled style={{ flex: labelFlex, color: "inherit" }} />
        <Input
          style={{ flex: inputFlex, pointerEvents: "none" }}
          value={updatedAt.toLocaleString()}
        />
      </Space.Compact>

    );
};

export default LastModified;