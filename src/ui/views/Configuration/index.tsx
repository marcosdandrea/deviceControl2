import React from "react";
import style from "./style.module.css";
import { ConfigProvider, theme } from "antd";
import { ConfigContextProvider } from "./context";
import ConfigurationTabs from "./components/ConfigurationTabs";
const Configuration = ({ onSaved }) => {


  return (
    <ConfigProvider
      theme={{ algorithm: theme.darkAlgorithm }}>
      <ConfigContextProvider>
        <div className={style.configurationView}>
          <ConfigurationTabs />
        </div>
      </ConfigContextProvider>
    </ConfigProvider>
  );
};

export default Configuration;
