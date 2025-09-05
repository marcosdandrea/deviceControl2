import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import style from './style.module.css';
import PropertiesPanel from "../PropertiesPanel";
import RoutineContainer from "./components/RoutineContainer";

const Desktop = () => {
    return (
        <div className={style.desktop}>
            <PanelGroup autoSaveId="desktop" direction="horizontal">
                <Panel>
                    <RoutineContainer/>
                </Panel>
                <PanelResizeHandle />
                <PropertiesPanel/>
            </PanelGroup>
        </div>
    );
}

export default Desktop;