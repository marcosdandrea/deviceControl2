import React from "react";
import styles from "./style.module.css";
import ProjectContextProvider from "@contexts/projectContextProvider";
import StatusBar from "./components/StatusBar";
import PasswordProtection from "./components/PasswordProtection";
import BlockedControl from "./components/BlockedControl";
import LicenseChecker from "./components/LicenceChecker";
import RoutineGroups from "./components/RoutineGroups";
import { ConfigProvider, theme } from "antd";

const Control = ({ isPreview }: { isPreview: boolean }) => {

  return (
    <div className={styles.controlView}>
      <ConfigProvider
        theme={{ algorithm: theme.darkAlgorithm }}>
        <ProjectContextProvider>
          <LicenseChecker>
            <BlockedControl disabled={isPreview}>
              <PasswordProtection>
                <RoutineGroups />
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
