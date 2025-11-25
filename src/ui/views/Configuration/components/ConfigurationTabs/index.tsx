import React from "react";
import "./style.module.css";
import style from "./style.module.css";
import { Tabs } from "antd";
import BasicConfiguration from "@views/Configuration/Views/BasicConfiguration";
import usePropietaryHardware from "@hooks/usePropietaryHardware";
import HardwareConfiguration from "@views/Configuration/Views/HardwareConfiguration";

const ConfigurationTabs = () => {

    const { isSignedHardware } = usePropietaryHardware();

    const items = [
        {
            key: '1',
            label: <div className={style.tabButtons}>Proyecto</div>,
            children: <BasicConfiguration />,
        },
        {
            key: '2',
            label: <div className={style.tabButtons}>Controlador</div>,
            //disabled: !isSignedHardware,
            children: <HardwareConfiguration />,
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