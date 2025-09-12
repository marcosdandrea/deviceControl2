import React from 'react';
import style from './style.module.css'
import Text from '@components/Text';
import ConditionTypeSelector from './ConditionTypeSelector';
import ConditionParameters from './ConditionParameters';

const ConditionConfiguration = () => {

    return (
        <div className={style.conditionConfiguration}>
            <Text 
                size={12}
                fontFamily='Open Sans Regular'
                style={{textAlign: 'center'}}
                color='white'>
                Configuración de Condición
            </Text>
            <ConditionTypeSelector/>
            <ConditionParameters/>
        </div>
    );
}

export default ConditionConfiguration;