import React from "react";
import { Typography } from "antd";
import style from "./style.module.css";

type SettingRowProps = {
    label: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    vertical?: boolean;
    children: React.ReactNode;
};

const SettingRow = ({ label, description, icon, vertical, children }: SettingRowProps) => (
    <div className={vertical ? `${style.row} ${style.vertical}` : style.row}>
        <div className={style.info}>
            {icon && <span className={style.icon}>{icon}</span>}
            <div className={style.text}>
                <Typography.Text className={style.label}>{label}</Typography.Text>
                {description && (
                    <Typography.Text type="secondary" className={style.rowDescription}>
                        {description}
                    </Typography.Text>
                )}
            </div>
        </div>
        <div className={style.control}>{children}</div>
    </div>
);

export default SettingRow;
