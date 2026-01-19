import React from 'react';
import style from './style.module.css'
import Text from '@components/Text';
import { Image } from 'antd';
import { usePreloadedImages } from '@contexts/PreloadedImagesProvider';
import disconnectedFallback from '@assets/disconnected.gif';

const DisconnectedView = () => {
    const { disconnectedImage } = usePreloadedImages();
    
    // Usar la imagen precargada si está disponible, sino usar el fallback importado directamente
    const imageSrc = disconnectedImage?.dataUrl || disconnectedFallback;
    
    return (
        <div className={style.notAllowed}>
            <Image
                draggable={false}
                preview={false}
                height={"25rem"}
                src={imageSrc}
                alt="Desconectado"
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