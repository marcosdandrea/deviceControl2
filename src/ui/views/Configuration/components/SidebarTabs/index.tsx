import React from "react";
import style from "./style.module.css";

type Tab = {
    key: string;
    label: string;
};

type SidebarTabsProps = {
    items: Tab[];
    activeKey: string;
    onChange: (key: string) => void;
};

const SidebarTabs = ({ items, activeKey, onChange }: SidebarTabsProps) => (
    <div className={style.sidebar}>
        {items.map((tab, index) => (
            <React.Fragment key={tab.key}>
                <div
                    className={`${style.item} ${activeKey === tab.key ? style.active : ""}`}
                    onClick={() => onChange(tab.key)}
                >
                    <span className={`${style.dot} ${activeKey === tab.key ? style.dotVisible : ""}`} />
                    {tab.label}
                </div>
                {index < items.length - 1 && <div className={style.divider} />}
            </React.Fragment>
        ))}
    </div>
);

export default SidebarTabs;
