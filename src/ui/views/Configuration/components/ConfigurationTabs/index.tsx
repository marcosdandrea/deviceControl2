import React, { useEffect, useState } from "react";
import "./style.module.css";
import style from "./style.module.css";
import { Tabs } from "antd";
import { MdOutlineFolder, MdOutlineDeveloperBoard, MdOutlineApps } from "react-icons/md";
import BasicConfiguration from "@views/Configuration/Views/BasicConfiguration";
import HardwareConfiguration from "@views/Configuration/Views/HardwareConfiguration";
import SoftwareConfiguration from "@views/Configuration/Views/SoftwareConfiguration";
import useProject from "@hooks/useProject";
import DisableWrapper from "@components/DisableWrapper";

const SOFTWARE_KEY = "3";

const ConfigurationTabs = () => {

    const { project } = useProject({ fetchProject: false });
    const noProject = !project;

    // Antd solo bloquea la navegación HACIA una pestaña deshabilitada: si Proyecto
    // (la pestaña activa por defecto) queda deshabilitada, seguiría mostrando su
    // contenido. Controlamos la pestaña activa para forzar Software cuando no hay proyecto.
    const [activeKey, setActiveKey] = useState(noProject ? SOFTWARE_KEY : "1");

    useEffect(() => {
        if (noProject) {
            setActiveKey((current) => (current === "1" || current === "2" ? SOFTWARE_KEY : current));
        }
    }, [noProject]);

    const items = [
        {
            key: '1',
            label: <div className={style.tabButtons}><MdOutlineFolder />Proyecto</div>,
            disabled: noProject,
            children: <DisableWrapper disable={noProject}><BasicConfiguration /></DisableWrapper>,
        },
        {
            key: '2',
            label: <div className={style.tabButtons}><MdOutlineDeveloperBoard />Hardware</div>,
            disabled: noProject,
            children: <DisableWrapper disable={noProject}><HardwareConfiguration /></DisableWrapper>,
        },
        {
            key: '3',
            label: <div className={style.tabButtons}><MdOutlineApps />Software</div>,
            children: <SoftwareConfiguration />,
        }
    ];

    return (
        <div className={style.configurationTabs}>
            <Tabs
                className=""
                type="card"
                activeKey={activeKey}
                onChange={setActiveKey}
                items={items}
                popupClassName="popup-tabs"
            />
        </div>
    );
}

export default ConfigurationTabs;