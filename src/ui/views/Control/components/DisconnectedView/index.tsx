import React from 'react';
import style from './style.module.css'
import Text from '@components/Text';
import { Image } from 'antd';
import { usePreloadedImages } from '@contexts/PreloadedImagesProvider';

const DisconnectedView = () => {
    const { disconnectedImage } = usePreloadedImages();
    
    return (
        <div className={style.notAllowed}>
            <Image
                draggable={false}
                preview={false}
                height={"25rem"}
                src={disconnectedImage.dataUrl || "/resources/images/404.gif"}
                alt="Not Allowed"
            />
            <Text className={style.h}>
                Este panel está desconectado de Device Control
            </Text>
            <Text className={style.p}>
                Por favor, verifique que el dispositivo esté encendido y conectado a la red.
            </Text>
        </div>
    );
}
 
export default DisconnectedView;