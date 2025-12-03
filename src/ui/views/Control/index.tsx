import React from "react";
import styles from "./style.module.css";
import ProjectContextProvider from "@contexts/projectContextProvider";
import StatusBar from "./components/StatusBar";
import PasswordProtection from "./components/PasswordProtection";
import BlockedControl from "./components/BlockedControl";
import LicenseChecker from "./components/LicenceChecker";
import { ConfigProvider, theme } from "antd";
import RoutinesView from "./components/RoutinesView";

const Control = ({ isPreview }: { isPreview: boolean }) => {

  return (
    <div className={styles.controlView}>
      <ConfigProvider
        theme={{ algorithm: theme.darkAlgorithm }}>
        <ProjectContextProvider>
          <LicenseChecker>
            <BlockedControl disabled={isPreview}>
              <PasswordProtection>
                <RoutinesView />
              </PasswordProtection>
              <StatusBar />
            </BlockedControl>
          </LicenseChecker>
        </ProjectContextProvider>
      </ConfigProvider>
    </div>
  );
};

export default Control;
