import { configContext } from "@views/Configuration/context";
import { Input, Space, Switch } from "antd";
import React, { useContext } from "react";
import style from "./style.module.css";


const ShowGroupsInControlView = () => {
    const { showGroupsInControlView, labelFlex, inputFlex, setProject } = useContext(configContext);

    const handleOnToggleSwitch = (checked: boolean) => {
        setProject((prevProject) => ({
            ...prevProject,
            showGroupsInControlView: checked,
        }));
    }

    return (
        <Space.Compact style={{ flex: 1 }}>
            <Input value="Mostrar grupos en vista de control" disabled style={{ flex: labelFlex, color: "inherit" }} />
            <div style={{flex: inputFlex}} className={style.switchContainer}>
                <Switch
                    value={showGroupsInControlView}
                    onChange={handleOnToggleSwitch}
                    checked={showGroupsInControlView}
                />
            </div>
        </Space.Compact>);
}

export default ShowGroupsInControlView;