import React from "react";
import style from "./style.module.css";
import useNetworkInterfaces from "@hooks/useNetworkInterfaces";
import { Spin } from "antd";
import InterfaceContextProvider from "./context";
import InterfaceSettings from "./components/InterfaceSettings";

const NetInterfaceConfiguration = () => {

    const {networkConfiguration, isLoading} = useNetworkInterfaces()

    if (isLoading) {
        return (
            <div className={style.loading}>
                <Spin />
            </div>
        );
    }

    return (
    <div className={style.interfaceSettings}>
        <InterfaceContextProvider netInterface={networkConfiguration}>
            <InterfaceSettings />
        </InterfaceContextProvider>
    </div>);
}

export default NetInterfaceConfiguration;