import React, { useState } from "react";
import SidebarTabs from "../../components/SidebarTabs";
import usePropietaryHardware from "@hooks/usePropietaryHardware";
import usePlatform from "@hooks/usePlatform";
import { NetworkInterfacesProvider } from "@contexts/NetworkInterfacesContext";
import Redes from "./Redes";
import Pantalla from "./Pantalla";
import Sonido from "./Sonido";
import ZonaHoraria from "./ZonaHoraria";
import style from "./style.module.css";

const Hardware = () => {
    const { isSignedHardware } = usePropietaryHardware();
    const { isLinux } = usePlatform();

    const tabs = [
        { key: "redes", label: "Redes", requirePropietaryHardware: true, requireLinux: true },
        { key: "pantalla", label: "Pantalla", requirePropietaryHardware: true },
        { key: "sonido", label: "Sonido", requirePropietaryHardware: false },
        { key: "zona", label: "Zona Horaria", requirePropietaryHardware: false, requireLinux: true },
    ].filter(
        (tab) => (!tab.requirePropietaryHardware || isSignedHardware) && (!tab.requireLinux || isLinux)
    );

    const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "sonido");

    const active = tabs.find((t) => t.key === activeKey) ? activeKey : tabs[0]?.key;

    return (
        <NetworkInterfacesProvider>
            <div className={style.wrapper}>
                <SidebarTabs items={tabs} activeKey={active} onChange={setActiveKey} />
                <div className={style.content}>
                    {active === "redes" && <Redes />}
                    {active === "pantalla" && <Pantalla />}
                    {active === "sonido" && <Sonido />}
                    {active === "zona" && <ZonaHoraria />}
                </div>
            </div>
        </NetworkInterfacesProvider>
    );
};

export default Hardware;
