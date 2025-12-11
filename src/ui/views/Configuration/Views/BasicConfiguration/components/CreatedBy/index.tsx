import React, { useMemo } from "react";
import { useContext } from "react";
import { Input, Space } from "antd";
import { configContext } from "@views/Configuration/context";

const CreatedBy = React.memo(() => {
    const { createdBy, labelFlex, inputFlex } = useContext(configContext);

    const compactStyle = useMemo(() => ({ flex: 1 }), []);
    const labelStyle = useMemo(() => ({ 
        flex: labelFlex, 
        color: "inherit" 
    }), [labelFlex]);
    const inputStyle = useMemo(() => ({ 
        flex: inputFlex,
        pointerEvents: "none",
    }), [inputFlex]);

    return (
      <Space.Compact style={compactStyle}>
        <Input value="Creado por" disabled style={labelStyle} />
        <Input
          style={inputStyle}
          value={createdBy}
        />
      </Space.Compact>

    );
});

export default CreatedBy;
