import React from 'react';
import style from './style.module.css';
import NodeView from '@views/NodeView';

function App() {

    return (
        <div className={style.app}>
           <NodeView/>
        </div>
    );
}

export default App;
