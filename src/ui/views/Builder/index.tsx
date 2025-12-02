import React from "react";
import PasswordProtection from "./components/PasswordProtection";
import { App, ConfigProvider, theme } from "antd";
import SystemNotifications from "@components/SystemNotifications";
import BuilderView from "./components/BuilderView";
import useLicense from "@hooks/useLicense";
import LicenseBox from "@components/LicenseBox";

const Builder = () => {

  const {isLicensed} = useLicense();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}>
      <App>
        <PasswordProtection> 
          <SystemNotifications />
          {
            isLicensed 
            ? <BuilderView />
            : <LicenseBox />
          }
        </PasswordProtection>
      </App>
    </ConfigProvider>
  );
};

export default Builder;
