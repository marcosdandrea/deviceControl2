import React from "react";
import Button from "@components/Button";
import { MdEventNote } from "react-icons/md";
import { Color } from "@common/theme/colors";

const ActivityLogButton = ({onClick, enabled}) => {
    return (
        <Button
            color={Color.primary}
            icon={<MdEventNote size={22} />}
            onClick={onClick}
            enabled={enabled}
        />
    );
}
 
export default ActivityLogButton;