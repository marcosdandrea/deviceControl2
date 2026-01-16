import React from "react";
import "./style.module.css";
import style from "./style.module.css";
import { Tabs } from "antd";
import BasicConfiguration from "@views/Configuration/Views/BasicConfiguration";
import HardwareConfiguration from "@views/Configuration/Views/HardwareConfiguration";
import useProject from "@hooks/useProject";
import DisableWrapper from "@components/DisableWrapper";

const ConfigurationTabs = () => {

    const { project } = useProject({ fetchProject: false });

    const items = [
        {
            key: '1',
            label: <div className={style.tabButtons}>Proyecto</div>,
            disabled: !project,
            children: <DisableWrapper disable={!project}><BasicConfiguration /></DisableWrapper>,
        },
        {
            key: '2',
            label: <div className={style.tabButtons}>Controlador</div>,
            children: <DisableWrapper disable={false}><HardwareConfiguration /></DisableWrapper>,
        }
    ];

    return (
        <div className={style.configurationTabs}>
            <Tabs
                className=""
                type="card"
                defaultActiveKey="1"
                items={items}
                popupClassName="popup-tabs"
            />
        </div>
    );
}

export default ConfigurationTabs;