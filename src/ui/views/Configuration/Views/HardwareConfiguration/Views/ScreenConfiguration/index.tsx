import React from "react";
import style from "./style.module.css";
import { Form } from "antd";
import { ScreenControllerContextProvider } from "@contexts/ScreenControllerContextProvider";
import AutoTurnOff from "./components/ScreenAutoTurnOff";
import Text from "@components/Text";

const ScreenConfiguration = () => {

    const LabelCap = (label: string) => (
        <span
            className={style.labels}>
            {label}
        </span>
    );

    return (
        <ScreenControllerContextProvider isPreview={true}>
            <div className={style.screenConfiguration}>
                <Text className={style.header}>
                    Configuración de Pantalla
                </Text>
                <Form>
                    <Form.Item
                        className={style.item}
                        label={LabelCap("Apagar Automáticamente")}>
                        <AutoTurnOff />
                    </Form.Item>
                </Form>
            </div>
        </ScreenControllerContextProvider>);
}

export default ScreenConfiguration;