import React, { useEffect, useState } from "react";
import { App, ConfigProvider, theme } from "antd";
import style from "./style.module.css";
import SoundContextProvider from "@contexts/SoundContextProvider";
import MainTabs from "./components/MainTabs";
import useProject from "@hooks/useProject";
import Proyecto from "./Views/Proyecto";
import Hardware from "./Views/Hardware";
import Software from "./Views/Software";

// Acento importado desde Claude Design (Panel de Configuracion.dc.html). Solo se usa acá
// para que overlays de antd (Modal.confirm, Tooltip, mensajes) combinen con el resto del
// panel, que está construido con componentes propios, no con el sistema de theming de antd.
const ACCENT = "#ff9307";

type ConfigurationProps = {
    onSaved: () => void;
};

const Configuration = ({ onSaved }: ConfigurationProps) => {
    const { project } = useProject({ fetchProject: false });
    const noProject = !project;

    // Antd bloquearía la navegación hacia una pestaña deshabilitada, pero no oculta su
    // contenido si ya estaba activa. Forzamos Software (siempre disponible) cuando no hay proyecto.
    const [mainTab, setMainTab] = useState(noProject ? "software" : "proyecto");

    useEffect(() => {
        if (noProject) {
            setMainTab((current) => (current === "proyecto" || current === "hardware" ? "software" : current));
        }
    }, [noProject]);

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: { colorPrimary: ACCENT, colorTextLightSolid: "#1a1200" },
            }}
        >
            <App style={{ height: "100%" }}>
                <SoundContextProvider isPreview={true}>
                    <div className={style.panel}>
                        <MainTabs
                            activeKey={mainTab}
                            onChange={setMainTab}
                            items={[
                                { key: "proyecto", label: "Proyecto", disabled: noProject },
                                { key: "hardware", label: "Hardware", disabled: noProject },
                                { key: "software", label: "Software" },
                            ]}
                        />
                        <div className={style.content}>
                            {mainTab === "proyecto" && !noProject && <Proyecto onSaved={onSaved} />}
                            {mainTab === "hardware" && !noProject && <Hardware />}
                            {mainTab === "software" && <Software />}
                        </div>
                    </div>
                </SoundContextProvider>
            </App>
        </ConfigProvider>
    );
};

export default Configuration;
