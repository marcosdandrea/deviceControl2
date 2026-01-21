import React from "react";
import style from "./style.module.css";
import { ConfigProvider, theme } from "antd";
import { ConfigContextProvider } from "./context";
import ConfigurationTabs from "./components/ConfigurationTabs";
import SoundContextProvider from "@contexts/SoundContextProvider";
const Configuration = ({ onSaved }) => {


  return (
    <ConfigProvider
      theme={{ algorithm: theme.darkAlgorithm }}>
      <SoundContextProvider isPreview={true}>
        <ConfigContextProvider>
          <div className={style.configurationView}>
            <ConfigurationTabs />
          </div>
        </ConfigContextProvider>
      </SoundContextProvider>
    </ConfigProvider>
  );
};

export default Configuration;
