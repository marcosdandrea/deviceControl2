import React from "react";
import style from "./style.module.css";

type FooterProps = {
    children: React.ReactNode;
    /** Espacio extra arriba del borde, para pantallas con contenido justo antes (Licencia). */
    marginTop?: number;
    /** Contenido extra (ej. cuenta regresiva de redirección) a la izquierda de los botones. */
    left?: React.ReactNode;
};

const Footer = ({ children, marginTop = 14, left }: FooterProps) => (
    <div className={style.footer} style={{ marginTop }}>
        {left}
        <div className={style.actions}>{children}</div>
    </div>
);

export default Footer;
