import React from "react";
import style from "./style.module.css";
import { Spin } from "antd";
import Text from "@components/Text";


export const LoadingMessage = () => {
    return (
        <div className={style.loadingMessage}>
            <div className={style.loader}>
                <Spin size="small" />
                <Text className={style.message}>Cargando...</Text>
            </div>
        </div>
    );
}