import React from "react";
import style from "./style.module.css";

type BannerProps = {
    variant: "info" | "success" | "warning" | "error";
    title?: string;
    children: React.ReactNode;
};

const Banner = ({ variant, title, children }: BannerProps) => (
    <div className={`${style.banner} ${style[variant]}`}>
        {title && <div className={style.title}>{title}</div>}
        <div className={style.content}>{children}</div>
    </div>
);

export default Banner;
