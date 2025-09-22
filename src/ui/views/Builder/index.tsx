import React from 'react';
import styles from './style.module.css';
import Desktop from './components/Desktop';
import StatusBar from './components/StatusBar';
import Toolbar from './components/Toolbar';
import { ConfigProvider, theme } from 'antd';
import LoadProjectButton from './components/Toolbar/components/LoadProjectButton';
import DownloadProjectButton from './components/Toolbar/components/DownloadProjectButton';
import UploadAndApplyButton from './components/Toolbar/components/UploadAndApplyButton';
import CloseProjectButton from './components/Toolbar/components/CloseProjectButton';
import OpenControlView from './components/Toolbar/components/OpenControlView';
import OpenTerminalView from './components/Toolbar/components/OpenTerminalView';
import ProjectName from './components/Toolbar/components/ProjectName';
import NewProjectButton from './components/Toolbar/components/NewProjectButton';
import Divider from './components/Toolbar/components/Divider';
import OpenConfigButton from './components/Toolbar/components/OpenConfigButton';
import ExecutionsTimelineButton from './components/Toolbar/components/ExecutionsTimelineButton';

const Builder = () => {

    return (
            <ConfigProvider
                theme={{
                    algorithm: theme.darkAlgorithm,
                }} >
                <div className={styles.builderView}>
                    <Toolbar >
                        <div className={styles.toolbarLeft} >
                            <NewProjectButton />
                            <LoadProjectButton />
                            <Divider />
                            <DownloadProjectButton />
                            <UploadAndApplyButton />
                            <Divider />
                            <CloseProjectButton />
                        </div>
                        <div className={styles.toolbarCenter} >
                            <ProjectName />
                        </div>
                        <div className={styles.toolbarRight} >
                            <OpenConfigButton />
                            <OpenControlView />
                            <ExecutionsTimelineButton />
                            <OpenTerminalView />
                        </div>
                    </Toolbar>
                    <Desktop />
                </div>
            </ConfigProvider >
    );
}

export default Builder;