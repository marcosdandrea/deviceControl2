import React from "react";
import { useContext } from "react";
import { Typography } from "antd";
import { configContext } from "@views/Configuration/context";
import SettingRow from "@components/SettingRow";

const CreatedAt = React.memo(() => {
    const { createdAt } = useContext(configContext);

    return (
      <SettingRow label="Creado el">
        <Typography.Text type="secondary">{createdAt.toLocaleString()}</Typography.Text>
      </SettingRow>
    );
});

export default CreatedAt;