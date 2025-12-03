import React from 'react';
import style from './style.module.css'
import Text from '@components/Text';
import { Image } from 'antd';

const NotAllowed = () => {
    return (
        <div className={style.notAllowed}>
            <Image
                draggable={false}
                preview={false}
                height={"25rem"}
                src="/resources/images/403ErrorForbidden.gif"
                alt="Not Allowed"
            />
            <Text className={style.h}>
                No tienes permiso para ver esta página.
            </Text>
            <Text className={style.p}>
                Por favor, contacta al administrador para obtener acceso.
            </Text>
        </div>
    );
}
 
export default NotAllowed;