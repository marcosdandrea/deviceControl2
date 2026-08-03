import React, { useState } from "react";
import SidebarTabs from "../../components/SidebarTabs";
import Licencia from "./Licencia";
import Actualizaciones from "./Actualizaciones";
import Registro from "./Registro";
import style from "./style.module.css";

const TABS = [
    { key: "licencia", label: "Licencia" },
    { key: "actualizaciones", label: "Actualizaciones" },
    { key: "registro", label: "Registro" },
];

const Software = () => {
    const [activeKey, setActiveKey] = useState("licencia");

    return (
        <div className={style.wrapper}>
            <SidebarTabs items={TABS} activeKey={activeKey} onChange={setActiveKey} />
            <div className={style.content}>
                {activeKey === "licencia" && <Licencia />}
                {activeKey === "actualizaciones" && <Actualizaciones />}
                {activeKey === "registro" && <Registro />}
            </div>
        </div>
    );
};

export default Software;
