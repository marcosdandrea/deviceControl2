import React from "react";
import { Card, Typography } from "antd";
import style from "./style.module.css";

type SettingsSectionProps = {
    title: React.ReactNode;
    icon?: React.ReactNode;
    description?: React.ReactNode;
    extra?: React.ReactNode;
    children: React.ReactNode;
};

const SettingsSection = ({ title, icon, description, extra, children }: SettingsSectionProps) => (
    <Card
        className={style.section}
        title={<span className={style.title}>{icon}{title}</span>}
        extra={extra}
    >
        {description && (
            <Typography.Text type="secondary" className={style.description}>
                {description}
            </Typography.Text>
        )}
        <div className={style.rows}>{children}</div>
    </Card>
);

export default SettingsSection;
