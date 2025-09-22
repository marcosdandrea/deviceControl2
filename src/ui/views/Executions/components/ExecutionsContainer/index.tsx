import React from 'react';
import styles from './style.module.css'
import ExecutionsList from './components/ExecutionsList';
import TimelineView from './components/TimelineView';

const ExecutionsContainer = () => {

    return ( <div className={styles.executionsContainer}>
        <ExecutionsList />
        <TimelineView />
    </div> );
}
 
export default ExecutionsContainer;