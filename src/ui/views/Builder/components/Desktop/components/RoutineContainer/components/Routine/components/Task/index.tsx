import React, { useContext } from "react";
import style from "./style.module.css";
import Item from "@views/Builder/components/Item";
import { routineContext } from "../..";
import Text from "@components/Text";
import MoreOptionsButton from "@views/Builder/components/MoreOptionsButton";
import { MdAdd, MdFlag, MdLan, MdWatchLater } from "react-icons/md";
import Button from "@components/Button";
import { useNavigate } from "react-router-dom";

const Task = ({ taskData }) => {

    const Navigate = useNavigate()

    const { routineData } = useContext(routineContext);


    const getJobIcon = (jobType) => {

        const getTextIcon = (text: string) => {
            return (
                <div
                    className={style.textIcon}>
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


        switch (jobType) {
            case "sendUDPJob":
                return getTextIcon("UDP");
            case "sendTCPJob":
                return getTextIcon("TCP");
            case "sendSerialJob":
                return getTextIcon("232");
            case "wakeOnLanJob":
                return <MdLan />;
            case "controlRoutineJob":
                return <MdFlag />
            case "waitJob":
                return <MdWatchLater />;
            case "sendArtnetJob":
                return getTextIcon("Artnet");
            case "sendPJLinkJob":
                return getTextIcon("PJ");
            default:
                return null;
        }
    }

    const handleOnCreateNewTask = (e) => {
        e.stopPropagation();
        Navigate(`/builder/${routineData.groupId}/${routineData.id}/task/newTask`)
    }

    const handleOnMoreOptionsClick = (e) => {
        e.stopPropagation();
        const queryParams = taskData.instanceId ? `?instanceId=${taskData.instanceId}` : "";
        Navigate(`/builder/${routineData.groupId}/${routineData.id}/task/${taskData.id}${queryParams}`)
    }


    if (!taskData?.name) {
        return (
            <div
                onClick={handleOnCreateNewTask}
                className={style.addTaskContent}>
                <Button
                    onClick={handleOnCreateNewTask}
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
                    Agregar Tarea
                </Text>
            </div>
        )
    }

    return (
        <Item
            className={style.task}
            isDraggable={routineData?.runInSync == true}
            style={{
                justifyContent: "center",
                alignItems: "center",
            }}
            id={taskData.instanceId || taskData.id}>
            <div className={style.taskContent}>
                <div className={style.taskHeader}>
                    {getJobIcon(taskData.job.type)}
                    <Text
                        style={{
                            textTransform: "capitalize",
                        }}
                        fontFamily="Open Sans SemiBold"
                        size={15}
                        color="white">
                        {taskData.name}
                    </Text>
                </div>
                <Text
                    size={12}
                    fontFamily="Open Sans Regular"
                    color="white">
                    {taskData.description}
                </Text>
            </div>
            {
                taskData.name &&
                <MoreOptionsButton onClick={handleOnMoreOptionsClick} />
            }
        </Item>
    );
}

export default Task;