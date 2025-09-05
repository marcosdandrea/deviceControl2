import React from 'react';
import styles from './style.module.css';
import useProject from '@hooks/useProject';
import Button from '@components/Button';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Desktop from './components/Desktop';
import StatusBar from './components/StatusBar';
import Toolbar from './components/Toolbar';

const Builder = () => {

    return (
        <div className={styles.builderView}>
            <Toolbar />
            <Desktop/>
            <StatusBar />
        </div>
    );
}

export default Builder;