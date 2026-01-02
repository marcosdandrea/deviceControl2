import React, { useContext } from "react";
import styles from "./style.module.css";
import Toolbar from "../Toolbar";
import BeforeExit from "@components/BeforeExit";
import NewProjectButton from "../Toolbar/components/NewProjectButton";
import LoadProjectButton from "../Toolbar/components/LoadProjectButton";
import DownloadProjectButton from "../Toolbar/components/DownloadProjectButton";
import UploadAndApplyButton from "../Toolbar/components/UploadAndApplyButton";
import CloseProjectButton from "../Toolbar/components/CloseProjectButton";
import OpenConfigButton from "../Toolbar/components/OpenConfigButton";
import OpenControlView from "../Toolbar/components/OpenControlView";
import BlockControlView from "../Toolbar/components/BlockControlView";
import ExecutionsTimelineButton from "../Toolbar/components/ExecutionsTimelineButton";
import OpenTerminalView from "../Toolbar/components/OpenTerminalView";
import Desktop from "../Desktop";
import Divider from "../Toolbar/components/Divider";
import ProjectName from "../Toolbar/components/ProjectName";
import LicenseBox from "@components/LicenseBox";
import { LicenceContext } from "@contexts/LicenceContextProvider";

const BuilderView = () => {

  const {isLicensed, fetching, systemFingerprint} = useContext(LicenceContext);

  if (!isLicensed && !fetching && systemFingerprint != null)
  return (<LicenseBox />)

  return (
    <div className={styles.builderView}>
      <Toolbar>
        <div className={styles.toolbarLeft}>
          <BeforeExit />
          <NewProjectButton />
          <LoadProjectButton />
          <Divider />
          <DownloadProjectButton />
          <UploadAndApplyButton />
          <Divider />
          <CloseProjectButton />
        </div>
        <div className={styles.toolbarCenter}>
          <ProjectName /> 
        </div>
        <div className={styles.toolbarRight}>
          <OpenConfigButton />
          <OpenControlView />
          <BlockControlView />
          <Divider />
          <ExecutionsTimelineButton />
          <OpenTerminalView />
        </div>
      </Toolbar>
      <Desktop />
    </div>
  );
};

export default BuilderView;
