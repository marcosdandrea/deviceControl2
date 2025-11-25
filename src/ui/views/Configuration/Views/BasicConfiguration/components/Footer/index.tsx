import React, { useContext } from 'react';
import style from './style.module.css';
import { Button, message } from 'antd';
import { configContext } from '@views/Configuration/context';

const Footer = ({onSaved}) => {


    const configCtx = useContext(configContext);

    const handleOnSave = () => {
        if (!configCtx) return;

        if (configCtx.passwordError !== undefined && configCtx.passwordError !== "") {
            message.error("Por favor, corrija la contraseña o eliminelaa para continuar.");
            return;
        };

        if (configCtx.projectName.trim() === "" || configCtx.projectName.length < 3) {
            message.error("El nombre del proyecto debe tener al menos 3 caracteres.");
            return;
        }

        configCtx.setProject((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                name: configCtx.projectName,
                password: configCtx.password,
                updatedAt: new Date(),
                description: configCtx.description,
            }
        });

        message.success("Configuración guardada correctamente.");
        onSaved();
    }

    return ( <div className={style.footer}>
        <div className={style.divisionLine} />
        <Button type="primary" onClick={handleOnSave}>Guardar</Button>
    </div>);
}
 
export default Footer;