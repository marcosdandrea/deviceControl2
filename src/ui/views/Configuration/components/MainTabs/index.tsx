import React from "react";
import style from "./style.module.css";

type Tab = {
    key: string;
    label: string;
    disabled?: boolean;
};

type MainTabsProps = {
    items: Tab[];
    activeKey: string;
    onChange: (key: string) => void;
};

const MainTabs = ({ items, activeKey, onChange }: MainTabsProps) => (
    <div className={style.bar}>
        {items.map((tab) => (
            <div
                key={tab.key}
                className={`${style.tab} ${activeKey === tab.key ? style.active : ""} ${tab.disabled ? style.disabled : ""}`}
                onClick={() => !tab.disabled && onChange(tab.key)}
            >
                {tab.label}
            </div>
        ))}
    </div>
);

export default MainTabs;
