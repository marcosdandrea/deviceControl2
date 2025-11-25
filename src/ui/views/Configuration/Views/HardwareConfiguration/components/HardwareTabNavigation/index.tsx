import React from "react";
import style from "./style.module.css";
import { Tabs } from "antd";
import ScreenConfiguration from "../../Views/ScreenConfiguration";
import PowerConfiguration from "../../Views/PowerConfiguration";
import NetInterfaceConfiguration from "../../Views/InterfaceConfiguration";
import WifiConfiguration from "../../Views/WifiConfiguration";
import { MdLan, MdOutlineScreenshotMonitor, MdOutlineWifi } from "react-icons/md";
import { ImPower } from "react-icons/im";

const HardwareTabNavigation = () => {

    const tabs = [
        {
            key: '1',
            label: <div className={style.label}><MdOutlineScreenshotMonitor /> Pantalla</div>,
            children: <ScreenConfiguration />,
        },
        {
            key: '2',
            label: <div className={style.label}><ImPower />Energía</div>,
            children: <PowerConfiguration />,
        },
        {
            key: '3',
            label: <div className={style.label}><MdOutlineWifi />WiFi</div>,
            children: <WifiConfiguration />,
        },
        {
            key: '4',
            label: <div className={style.label}><MdLan />Interfaces</div>,
            children: <NetInterfaceConfiguration />,
        },
    ];

    return (
        <div className={style.hardwareTabNavigation}>
            <Tabs
                style={{
                    width: "100%",
                    height: "100%"
                }}
                className={style.tabs}
                tabPosition="left"
                defaultActiveKey="1"
                items={tabs}
                popupClassName="popup-tabs"
            />
        </div>
    );
}

export default HardwareTabNavigation;