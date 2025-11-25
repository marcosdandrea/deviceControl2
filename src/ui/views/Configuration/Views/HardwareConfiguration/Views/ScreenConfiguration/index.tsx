import React from "react";
import style from "./style.module.css";
import { Form } from "antd";
import ScreenContextProvider from "./context";
import AutoTurnOff from "./components/ScreenAutoTurnOff";
import Brightness from "./components/ScreenBrightness";
import Text from "@components/Text";

const ScreenConfiguration = () => {

    const LabelCap = (label: string) => (
        <span
            className={style.labels}>
            {label}
        </span>
    );

    return (
        <ScreenContextProvider>
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
                    <Form.Item
                        className={style.item}
                        label={LabelCap("Brillo de Pantalla")}>
                        <Brightness />
                    </Form.Item>
                </Form>
            </div>
        </ScreenContextProvider >);
}

export default ScreenConfiguration;