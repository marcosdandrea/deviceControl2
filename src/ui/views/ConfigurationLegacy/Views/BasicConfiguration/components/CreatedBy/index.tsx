import React from "react";
import { useContext } from "react";
import { Typography } from "antd";
import { configContext } from "@views/ConfigurationLegacy/context";
import SettingRow from "@components/SettingRow";

const CreatedBy = React.memo(() => {
    const { createdBy } = useContext(configContext);

    return (
      <SettingRow label="Creado por">
        <Typography.Text type="secondary">{createdBy}</Typography.Text>
      </SettingRow>
    );
});

export default CreatedBy;
