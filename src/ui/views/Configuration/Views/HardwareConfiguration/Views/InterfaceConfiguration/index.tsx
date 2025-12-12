import React from "react";
import style from "./style.module.css";
import useNetworkInterfaces from "@hooks/useNetworkInterfaces";
import { Tabs } from "antd";
import InterfaceContextProvider from "./context";
import InterfaceSettings from "./components/InterfaceSettings";
import { Logger } from "@helpers/logger";

const NetInterfaceConfiguration = () => {

    const {networkInterfaces, applyChanges} = useNetworkInterfaces()

    Logger.log ("Network Interfaces:", networkInterfaces);

    return (
    <div className={style.interfaceSettings}>
        <Tabs>
            {networkInterfaces.map((netInterface) => (
                <Tabs.TabPane tab={netInterface.device} key={netInterface.device}>
                    <InterfaceContextProvider 
                        onApplyChanges={applyChanges}
                        netInterface={netInterface}>
                        <InterfaceSettings />
                    </InterfaceContextProvider>
                </Tabs.TabPane>
            ))}
        </Tabs>
    </div>);
}

export default NetInterfaceConfiguration;