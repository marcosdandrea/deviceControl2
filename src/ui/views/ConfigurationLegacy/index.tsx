import React from "react";
import style from "./style.module.css";
import { ConfigProvider, theme } from "antd";
import { ConfigContextProvider } from "./context";
import ConfigurationTabs from "./components/ConfigurationTabs";
import SoundContextProvider from "@contexts/SoundContextProvider";
// Paleta exacta importada desde Claude Design (Panel de Configuracion.dc.html).
const ACCENT = "#ff9307";
const TEXT = "#e8e8ea";
const TEXT_SECONDARY = "#8b8b90";
const CARD_BG = "#242428";
const INPUT_BG = "#141416";
const BORDER = "rgba(255,255,255,0.14)";
const BORDER_SOFT = "rgba(255,255,255,0.06)";

const Configuration = ({ onSaved }) => {


  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: ACCENT,
          colorSuccess: "#28a745",
          colorWarning: "#ffc107",
          colorError: "#dc3545",
          colorInfo: "#17a2b8",
          colorBgContainer: CARD_BG,
          colorBgElevated: CARD_BG,
          colorBorder: BORDER_SOFT,
          colorBorderSecondary: BORDER_SOFT,
          colorText: TEXT,
          colorTextSecondary: TEXT_SECONDARY,
          colorTextDescription: TEXT_SECONDARY,
          colorTextLightSolid: "#1a1200",
          borderRadius: 6,
          borderRadiusLG: 10,
          fontSize: 12.5,
        },
        components: {
          Input: { colorBgContainer: INPUT_BG, colorBorder: BORDER },
          InputNumber: { colorBgContainer: INPUT_BG, colorBorder: BORDER },
          Select: { colorBgContainer: INPUT_BG, colorBorder: BORDER },
          Button: { borderRadius: 7 },
          Switch: { trackHeight: 20, trackMinWidth: 36, trackPadding: 2, handleSize: 16 },
          Tabs: {
            itemColor: TEXT_SECONDARY,
            itemSelectedColor: TEXT,
            itemHoverColor: TEXT,
            itemActiveColor: TEXT,
            inkBarColor: ACCENT,
          },
        },
      }}>
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
