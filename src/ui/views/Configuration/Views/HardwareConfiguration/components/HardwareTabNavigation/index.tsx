import React from "react";
import style from "./style.module.css";
import { Tabs } from "antd";
import NetInterfaceConfiguration from "../../Views/InterfaceConfiguration";
import WifiConfiguration from "../../Views/WifiConfiguration";
import { MdLan, MdOutlineKey, MdOutlineScreenshotMonitor, MdOutlineWifi, MdAccessTime } from "react-icons/md";
import { HiSpeakerWave } from "react-icons/hi2";
import usePropietaryHardware from "@hooks/usePropietaryHardware";
import LicenseManager from "../../Views/LicenseManager";
import ScreenConfiguration from "../../Views/ScreenConfiguration";
import SoundConfiguration from "../../Views/SoundConfiguration";
import LocalizationConfiguration from "../../Views/LocalizationConfiguration";

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
            key: '1',
            requirePropietaryHardware: true,
            label: <div className={style.label}><MdLan />Redes</div>,
            children: <NetInterfaceConfiguration />,
        },
        {
            key: '2',
            requirePropietaryHardware: false,
            label: <div className={style.label}><MdOutlineKey />Licencia</div>,
            children: <LicenseManager/>,
        },
        {
            key: '3',
            requirePropietaryHardware: true,
            label: <div className={style.label}><MdOutlineScreenshotMonitor />Pantalla</div>,
            children: <ScreenConfiguration />,
        },
        {
            key: '4',
            requirePropietaryHardware: false,
            label: <div className={style.label}><HiSpeakerWave />Sonido</div>,
            children: <SoundConfiguration />,
        },
        {
            key: '5',
            requirePropietaryHardware: false,
            label: <div className={style.label}><MdAccessTime />Zona Horaria</div>,
            children: <LocalizationConfiguration />,
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