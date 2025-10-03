import React from "react";
import styles from "./style.module.css";
import RoutineList from "./components/RoutineList";
import ProjectContextProvider from "@contexts/projectContextProvider";
import StatusBar from "./components/StatusBar";
import PasswordProtection from "./components/PasswordProtection";
import BlockedControl from "./components/BlockedControl";
import useLicense from "@hooks/useLicense";

const Control = ({ isPreview }: { isPreview: boolean }) => {
  const { isLicensed } = useLicense();

  return (
    <div className={styles.controlView}>
      <ProjectContextProvider>
        {isLicensed ? (
          <BlockedControl disabled={isPreview}>
            <PasswordProtection>
              <RoutineList />
            </PasswordProtection>
            <StatusBar />
          </BlockedControl>
        ) : (
          <div className={styles.licenseRequired}>
            <h2>License Requerida</h2>
            <p>
              Active la licencia de <strong>DeviceControl</strong> usando el panel Builder.
            </p>
          </div>
        )}
      </ProjectContextProvider>
    </div>
  );
};

export default Control;
