import React, { useContext } from "react";
import style from "./style.module.css";
import Item from "@views/Builder/components/Item";
import { routineContext } from "../..";
import Text from "@components/Text";
import MoreOptionsButton from "@views/Builder/components/MoreOptionsButton";
import { MdAdd, MdFlashOn, MdOutlineWatch } from "react-icons/md";
import { FaFlagCheckered } from "react-icons/fa";
import { GrAssistListening } from "react-icons/gr";
import Button from "@components/Button";
import { useNavigate } from "react-router-dom";

const Trigger = ({ triggerData }) => {
    const { routineData } = useContext(routineContext);

    const Navigate = useNavigate()

    const handleOnMoreOptionsClick = (e) => {
        e.stopPropagation();
        const queryParams = triggerData.instanceId ? `?instanceId=${triggerData.instanceId}` : "";
        Navigate(`/builder/${routineData.id}/trigger/${triggerData.id}${queryParams}`)
    }

    const handleOnAddNewTrigger = (e) => {
        e.stopPropagation();
        Navigate(`/builder/${routineData.id}/trigger/newTrigger`)
    }

    const getTriggerIcon = (triggerType) => {

        const getTextIcon = (text: string) => {
            return (
                <div
                    className={style.textIcon}>
                    <MdFlashOn
                        color="black"
                        style={{
                            position: "absolute",
                            top: "-20%",
                            left: "-20%",
                        }}
                    />
                    <Text
                        style={{
                            width: "auto"
                        }}
                        fontFamily="Open Sans Bold"
                        size={8}>
                        {text}
                    </Text>
                </div>
            )
        }

        switch (triggerType) {
            case "api":
                return getTextIcon("API");
            case "cron":
                return <MdOutlineWatch />;
            case "tcp":
                return getTextIcon("TCP");
            case "udp":
                return getTextIcon("UDP");
            case "onStart":
                return <FaFlagCheckered />
            case "onRoutineEvent":
                return <GrAssistListening />;
            default:
                return null;
        }
    }

    if (!triggerData?.name) {
        return (
            <div
                onClick={handleOnAddNewTrigger}
                className={style.addTriggerContent}>
                <Button
                    onClick={handleOnAddNewTrigger}
                    styles={{
                        width: "1.5rem",
                        height: "1.5rem",
                    }}
                    color="gray"
                    icon={<MdAdd size={18} />} />
                <Text
                    style={{
                        textAlign: "left",
                        color: "white"
                    }}
                    fontFamily="Open Sans SemiBold"
                    size={14}>
                    Agregar Disparador
                </Text>
            </div>
        )
    }

    return (
            <Item
                className={style.trigger}
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                }}
                isDraggable={false}
                id={triggerData.instanceId || triggerData.id}>
                <div className={style.triggerContent}>
                    <div className={style.triggerHeader}>
                        {getTriggerIcon(triggerData.type)}
                        <Text
                            style={{
                                textTransform: "capitalize",
                            }}
                            fontFamily="Open Sans Bold"
                            size={15}
                            color="white">
                            {triggerData.name}
                        </Text>
                    </div>
                    <Text
                        size={12}
                        fontFamily="Open Sans Regular"
                        color="white">
                        {triggerData.description}
                    </Text>
                </div>
                <MoreOptionsButton onClick={handleOnMoreOptionsClick} />
            </Item>
    );
}

export default Trigger;