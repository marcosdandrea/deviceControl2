import React from "react";
import styles from "./style.module.css";
import RoutineList from "./components/RoutineList";
import ProjectContextProvider from "@contexts/projectContextProvider";
import StatusBar from "./components/StatusBar";
import PasswordProtection from "./components/PasswordProtection";
import BlockedControl from "./components/BlockedControl";

const Control = ({isPreview}: {isPreview: boolean}) => {
  return (
    <div className={styles.controlView}>
      <ProjectContextProvider>
        <BlockedControl disabled={isPreview}>
          <PasswordProtection>
            <RoutineList />
          </PasswordProtection>
          <StatusBar />
        </BlockedControl>
      </ProjectContextProvider>
    </div>
  );
};

export default Control;
