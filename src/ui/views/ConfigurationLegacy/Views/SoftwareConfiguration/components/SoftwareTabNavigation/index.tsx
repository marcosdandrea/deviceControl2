import React from "react";
import style from "./style.module.css";
import { Tabs } from "antd";
import LicenseManager from "../../Views/LicenseManager";
import UpdatesConfiguration from "../../Views/UpdatesConfiguration";
import LogRetentionConfiguration from "../../Views/LogRetentionConfiguration";

const SoftwareTabNavigation = () => {

    const tabs = [
        {
            key: '1',
            label: <div className={style.label}><span className={style.dot} />Licencia</div>,
            children: <LicenseManager />,
        },
        {
            key: '2',
            label: <div className={style.label}><span className={style.dot} />Actualizaciones</div>,
            children: <UpdatesConfiguration />,
        },
        {
            key: '3',
            label: <div className={style.label}><span className={style.dot} />Registro</div>,
            children: <LogRetentionConfiguration />,
        },
    ];

    return (
        <div className={style.softwareTabNavigation}>
            <Tabs
                style={{
                    width: "100%",
                    height: "100%"
                }}
                className={style.tabs}
                tabPosition="left"
                items={tabs}
                popupClassName="popup-tabs"
            />
        </div>
    );
}

export default SoftwareTabNavigation;
