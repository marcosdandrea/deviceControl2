import React, { Suspense } from "react";
import PasswordProtection from "./components/PasswordProtection";
import { App, ConfigProvider, theme } from "antd";
import SystemNotifications from "@components/SystemNotifications";
import BuilderView from "./components/BuilderView";
import LicenceContextProvider from "@contexts/LicenceContextProvider";
import { LoadingMessage } from "@components/LoadingMessage";

const Builder = () => {


  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}>
      <App>
        <PasswordProtection>
          <SystemNotifications />
          <Suspense fallback={<LoadingMessage message='Comprobando Licencia...' />}>
            <LicenceContextProvider>
              <BuilderView />
            </LicenceContextProvider>
          </Suspense>
        </PasswordProtection>
      </App>
    </ConfigProvider>
  );
};

export default Builder;
