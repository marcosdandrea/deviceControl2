import React from "react";
import "./style.module.css";
import style from "./style.module.css";
import { Tabs } from "antd";
import BasicConfiguration from "@views/Configuration/Views/BasicConfiguration";
import usePropietaryHardware from "@hooks/usePropietaryHardware";
import HardwareConfiguration from "@views/Configuration/Views/HardwareConfiguration";
import useProject from "@hooks/useProject";

const ConfigurationTabs = () => {

    const { isSignedHardware } = usePropietaryHardware();
    const { project } = useProject({ fetchProject: false });

    const DisableWrapper = ({ children, disable }) => (
        <div style={{ 
                width: "100%",
                height: "100%",
                pointerEvents: disable ? 'none' : 'auto', 
                filter: disable ? 'grayscale(100%) opacity(0.6)' : 'none'
                }}>
            {children}
        </div>
    );  

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
            disabled: !isSignedHardware,
            children: <DisableWrapper disable={!isSignedHardware}><HardwareConfiguration /></DisableWrapper>,
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