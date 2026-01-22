import React from "react";
import styles from "./style.module.css";
import StatusBar from "./components/StatusBar";
import PasswordProtection from "./components/PasswordProtection";
import BlockedControl from "./components/BlockedControl";
import LicenseChecker from "./components/LicenceChecker";
import { ConfigProvider, theme } from "antd";
import RoutinesView from "./components/RoutinesView";
import { NetworkInterfacesProvider } from "@contexts/NetworkInterfacesContext";
import { ScreenControllerContextProvider } from "@contexts/ScreenControllerContextProvider";
import FadeInSoft from "@components/FadeInSoft";
import SoundContextProvider from "@contexts/SoundContextProvider";
import CursorHider from "@components/CursorHidder";

const Control = ({ isPreview }: { isPreview: boolean }) => {

  return (
    <div className={styles.controlView}>
      <ConfigProvider
        theme={{ algorithm: theme.darkAlgorithm }}>
        {/* <ProjectContextProvider> innecesario si ya está en App.tsx */}
        <CursorHider hideCursor={!isPreview}>
          <SoundContextProvider isPreview={isPreview}>
            <ScreenControllerContextProvider isPreview={isPreview}>
              <NetworkInterfacesProvider>
                <LicenseChecker>
                  <BlockedControl disabled={isPreview}>
                    <PasswordProtection>
                      <FadeInSoft disable={isPreview} delay="1s" transitionTime="1s">
                        <RoutinesView />
                      </FadeInSoft>
                    </PasswordProtection>
                    <StatusBar />
                  </BlockedControl>
                </LicenseChecker>
              </NetworkInterfacesProvider>
            </ScreenControllerContextProvider>
          </SoundContextProvider>
        </CursorHider>
        {/* </ProjectContextProvider> */}
      </ConfigProvider>
    </div>
  );
};

export default Control;
