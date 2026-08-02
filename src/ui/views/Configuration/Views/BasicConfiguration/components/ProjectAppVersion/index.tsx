import React from "react";
import { useContext } from "react";
import { Typography } from "antd";
import { configContext } from "@views/Configuration/context";
import SettingRow from "@components/SettingRow";

const ProjectAppVersion = React.memo(() => {
    const { appVersion } = useContext(configContext);

    return (
      <SettingRow label="Creado con la versión">
        <Typography.Text type="secondary">{appVersion}</Typography.Text>
      </SettingRow>
    );
});

export default ProjectAppVersion;
