import style from './style.module.css';
import React from "react";
import { Panel } from "react-resizable-panels";

const PropertiesPanel = () => {
    return (<Panel
        className={style.propertiesPanel}
        maxSize={35}
        minSize={25}
        collapsible={true}
        defaultSize={10}>
    </Panel>);
}

export default PropertiesPanel;