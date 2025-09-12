import React from 'react';
import style from './style.module.css'
import JobTypeSelector from './JobTypeSelector';
import Text from '@components/Text';
import JobParameters from './JobParameters';

const JobConfiguration = () => {

    return (
        <div className={style.jobConfiguration}>
            <Text 
                size={12}
                fontFamily='Open Sans Regular'
                style={{textAlign: 'center'}}
                color='white'>
                Configuración de Trabajo
            </Text>
            <JobTypeSelector />
            <JobParameters />
        </div>
    );
}

export default JobConfiguration;