import React from "react";
import style from "./style.module.css";

type RowProps = {
    label: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    /** Alto de la fila. El mockup usa 12px para Redes/Pantalla, 11px para Sonido y 10px para Actualizaciones/Registro. */
    padding?: number;
    bordered?: boolean;
};

const Row = ({ label, description, children, padding = 12, bordered = true }: RowProps) => (
    <div
        className={style.row}
        style={{
            padding: `${padding}px 0`,
            borderBottom: bordered ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}
    >
        <div>
            <div className={style.label}>{label}</div>
            {description && <div className={style.description}>{description}</div>}
        </div>
        <div className={style.control}>{children}</div>
    </div>
);

export default Row;
