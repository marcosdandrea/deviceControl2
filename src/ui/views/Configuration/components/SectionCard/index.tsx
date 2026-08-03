import React from "react";
import style from "./style.module.css";

type SectionCardProps = {
    children: React.ReactNode;
};

/** Tarjeta con fondo/borde propio — usada únicamente por la pestaña Proyecto,
 * que es la única pantalla del diseño que lleva este tratamiento. */
const SectionCard = ({ children }: SectionCardProps) => (
    <div className={style.card}>{children}</div>
);

export default SectionCard;
