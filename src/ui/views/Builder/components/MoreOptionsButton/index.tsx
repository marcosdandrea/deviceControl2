import React from "react";
import style from './style.module.css';
import { MdMoreHoriz } from "react-icons/md";

const MoreOptionsButton = ({ onClick }) => {
    return (
        <div
            className={style.moreOptionsButton}
            onClick={onClick}>
            <MdMoreHoriz size={20} color="white" />
        </div>);
}

export default MoreOptionsButton;
