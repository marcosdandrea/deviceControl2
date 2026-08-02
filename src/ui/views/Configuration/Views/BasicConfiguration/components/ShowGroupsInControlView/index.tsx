import { configContext } from "@views/Configuration/context";
import { Switch } from "antd";
import React, { useContext } from "react";
import SettingRow from "@components/SettingRow";

const ShowGroupsInControlView = () => {
    const { showGroupsInControlView, setProject } = useContext(configContext);

    const handleOnToggleSwitch = (checked: boolean) => {
        setProject((prevProject) => ({
            ...prevProject,
            showGroupsInControlView: checked,
        }));
    }

    return (
        <SettingRow
            label="Mostrar grupos en vista de control"
            description="Agrupa las rutinas por grupo en la vista de control"
        >
            <Switch
                onChange={handleOnToggleSwitch}
                checked={showGroupsInControlView}
            />
        </SettingRow>
    );
}

export default ShowGroupsInControlView;