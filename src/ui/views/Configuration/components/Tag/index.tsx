import React from "react";
import style from "./style.module.css";

type TagProps = {
    children: React.ReactNode;
    color?: "warning";
};

const Tag = ({ children }: TagProps) => <span className={style.tag}>{children}</span>;

export default Tag;
