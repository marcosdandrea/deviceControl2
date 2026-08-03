import React from "react";
import style from "./style.module.css";

type ScreenTitleProps = {
    title: string;
    description?: string;
    /** "card": título dentro de la tarjeta de Proyecto. "screen": título directo sobre el fondo. */
    spacing?: "card" | "screen";
};

const ScreenTitle = ({ title, description, spacing = "screen" }: ScreenTitleProps) => (
    <>
        <div className={style.title}>{title}</div>
        {description && (
            <p className={spacing === "card" ? style.descriptionCard : style.descriptionScreen}>
                {description}
            </p>
        )}
    </>
);

export default ScreenTitle;
