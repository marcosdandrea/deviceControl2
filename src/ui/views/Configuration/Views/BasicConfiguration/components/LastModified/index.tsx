import React from "react";
import { useContext } from "react";
import { Typography } from "antd";
import { configContext } from "@views/Configuration/context";
import SettingRow from "@components/SettingRow";

const LastModified = React.memo(() => {
    const { updatedAt } = useContext(configContext);

    return (
      <SettingRow label="Última modificación">
        <Typography.Text type="secondary">{updatedAt.toLocaleString()}</Typography.Text>
      </SettingRow>
    );
});

export default LastModified;