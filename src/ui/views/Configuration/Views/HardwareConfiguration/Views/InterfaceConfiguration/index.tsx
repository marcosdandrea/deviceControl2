import React from "react";
import style from "./style.module.css";
import useNetworkInterfaces from "@hooks/useNetworkInterfaces";
import { Tabs } from "antd";
import InterfaceContextProvider from "./context";
import InterfaceSettings from "./components/InterfaceSettings";

const NetInterfaceConfiguration = () => {

    const {networkConfiguration, isLoading} = useNetworkInterfaces()

    // No renderizar si aún está cargando
    if (isLoading) {
        return <div>Cargando configuración de red...</div>;
    }

    return (
    <div className={style.interfaceSettings}>
        <Tabs>
                <Tabs.TabPane tab={"LAN"} key={"lan"}>
                    <InterfaceContextProvider netInterface={networkConfiguration}>
                        <InterfaceSettings />
                    </InterfaceContextProvider>
             </Tabs.TabPane>
        </Tabs>
    </div>);
}

export default NetInterfaceConfiguration;