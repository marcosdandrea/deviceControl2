import React from "react";
import styles from "./style.module.css";
import RoutineList from "./components/RoutineList";
import ProjectContextProvider from "@contexts/projectContextProvider";
import StatusBar from "./components/StatusBar";
import PasswordProtection from "./components/PasswordProtection";
import BlockedControl from "./components/BlockedControl";
import LicenseChecker from "./components/LicenceChecker";

const Control = ({ isPreview }: { isPreview: boolean }) => {

  return (
    <div className={styles.controlView}>
      <ProjectContextProvider>
        <LicenseChecker>
          <BlockedControl disabled={isPreview}>
            <PasswordProtection>
              <RoutineList />
            </PasswordProtection>
            <StatusBar />
          </BlockedControl>
        </LicenseChecker>
      </ProjectContextProvider>
    </div>
  );
};

export default Control;
