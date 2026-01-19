import React from "react";
import style from "./style.module.css";
import { Tabs } from "antd";
import NetInterfaceConfiguration from "../../Views/InterfaceConfiguration";
import WifiConfiguration from "../../Views/WifiConfiguration";
import { MdLan, MdOutlineWifi } from "react-icons/md";
import usePropietaryHardware from "@hooks/usePropietaryHardware";
import LicenseManager from "../../Views/LicenseManager";

const HardwareTabNavigation = () => {

    const { isSignedHardware } = usePropietaryHardware();

    const tabs = [
/*         {
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
            key: '1',
            requirePropietaryHardware: true,
            label: <div className={style.label}><MdOutlineWifi />WiFi</div>,
            children: <WifiConfiguration />,
        },
        */
        {
            key: '2',
            requirePropietaryHardware: true,
            label: <div className={style.label}><MdLan />Interfaces</div>,
            children: <NetInterfaceConfiguration />,
        },
        {
            key: '3',
            requirePropietaryHardware: false,
            label: <div className={style.label}>Licencia</div>,
            children: <LicenseManager/>,
        }
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
                items={tabs.filter(tab => !tab.requirePropietaryHardware || isSignedHardware)}
                popupClassName="popup-tabs"
            />
        </div>
    );
}

export default HardwareTabNavigation;