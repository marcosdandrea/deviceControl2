import React, { useContext, useEffect, useState } from "react";
import style from "./style.module.css";
import SortableList from "react-easy-sort";
import { routineContext } from "../..";
import useProject from "@hooks/useProject";
import Text from "@components/Text";
import Task from "../Task";
import Trigger from "../Trigger";

const TriggersContainer = () => {

    const {routineData} = useContext(routineContext);
    const {project} = useProject()
    const [triggers, setTriggers] = useState(routineData?.triggers || []);

    useEffect(()=>{
        if (!project || !routineData) return;
        const routineTriggers = project.triggers.filter(trigger => routineData.triggersId?.includes(trigger.id)) || [];
        setTriggers([...routineTriggers, {}])

    },[project, routineData])

    const onSortEnd = (oldIndex: number, newIndex: number) => {
        console.log(oldIndex, newIndex);
        console.log (routineData)
    }   

    return (
        <div className={style.triggersContainer}>
            <Text
                color="gray"
                size={12}>
                {`Disparadores: ${triggers?.length - 1 || 0}`}
                </Text>
            <SortableList
                dir="vertical"
                className={style.triggersList}
                allowDrag={routineData.runInSync == true}
                draggedItemClassName={style.draggedItem}
                onSortEnd={onSortEnd}>
                    {
                        triggers?.map((trigger: any) => (
                            <Trigger
                                key={trigger.id}
                                triggerData={trigger}/>
                        ))
                    }
            </SortableList>
        </div>
    );
}


export default TriggersContainer;